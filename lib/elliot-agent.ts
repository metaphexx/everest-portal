// ============================================================
// Elliot's agentic brain for the floating assistant. Deterministic
// intent engine: reads live portal state, answers with real numbers,
// and returns ACTIONS the FAB renders as buttons (navigate, start a
// worksheet submission, log a support request). Swap for a real
// tool-calling model when the API backend lands.
// ============================================================

import { ChatAction, ChatMsg } from "./store";
import { Outline, outlineAverage } from "./features";

export interface AgentContext {
  dueCount: number;
  completionPct: number;
  outlines: Outline[];
  unreadMessages: number;
  openSupportCount: number;
}

export interface AgentPlan {
  reply: ChatMsg;
  /** When set, the FAB should create a support request with this payload before showing the reply. */
  createSupport?: { type: string; message: string };
}

const nav = (label: string, href: string): ChatAction => ({ label, kind: "nav", href });

export function elliotAgent(text: string, ctx: AgentContext): AgentPlan {
  const t = text.toLowerCase();

  // --- distress: route like the messaging safeguarding path, human-first ---
  if (/(unsafe|not safe|scared|hurt myself|can'?t cope|depressed|bullied)/.test(t)) {
    return {
      reply: {
        who: "e",
        text: "Thank you for telling me. That sounds really hard, and a person should be with you on this, not just me. I've let the Everest team know so someone checks in with you today. You are not in trouble. If you are in immediate danger call 000, or Kids Helpline on 1800 55 1800 any time.",
        actions: [nav("Talk to the Everest team", "/messages"), nav("Message your tutor", "/messages")],
      },
      createSupport: { type: "Wellbeing", message: "Elliot flagged a wellbeing concern from chat: “" + text.slice(0, 140) + "”" },
    };
  }

  // --- complaints / billing / technical -> log a ticket on the spot ---
  const complaint = /(complain|complaint|problem with|issue with|not working|broken|bug|error|charged|overcharged|refund|billing|invoice|payment)/.test(t);
  if (complaint) {
    const type = /(charged|refund|billing|invoice|payment)/.test(t) ? "Billing" : "Technical problem";
    return {
      reply: {
        who: "e",
        text: "Sorry about that. I've logged this with the Everest team as a " + type.toLowerCase() + " request so a person follows it up - you can watch its status on the Support page, and any replies land there too. Anything else you want me to add to it?",
        actions: [nav("Track my request", "/support"), nav("Chat to the team", "/messages")],
      },
      createSupport: { type, message: "Logged by Elliot from chat: “" + text.slice(0, 180) + "”" },
    };
  }

  // --- worksheets due / submit ---
  if (/(due|submit|homework|worksheet|hand in)/.test(t)) {
    const n = ctx.dueCount;
    return {
      reply: {
        who: "e",
        text: n === 0 ? "Nothing is due right now - you're completely caught up. Want to get ahead with something from the library?" : "You have " + n + " worksheet" + (n === 1 ? "" : "s") + " to submit. The Whole Numbers Topic Test for Saturday is the most urgent. Want to submit one now?",
        actions: n === 0 ? [nav("Open Library", "/library")] : [{ label: "Submit a worksheet", kind: "submit" }, nav("See all worksheets", "/drive")],
      },
    };
  }

  // --- next class / timetable ---
  if (/(next class|next session|when.*class|timetable|schedule)/.test(t)) {
    return {
      reply: {
        who: "e",
        text: "Your next class is Organic Chemistry tonight at 7:00 pm with Priya Rao. The join button on your dashboard goes live at class time.",
        actions: [nav("Open Timetable", "/timetable"), nav("Go to Dashboard", "/")],
      },
    };
  }

  // --- assessments / outline / average ---
  if (/(assessment|test|exam|outline|average|tracker)/.test(t)) {
    const all = ctx.outlines.flatMap((o) => o.assessments);
    const next = all.filter((a) => !a.done)[0];
    const avg = ctx.outlines.length ? outlineAverage(ctx.outlines[0].assessments) : null;
    const bits: string[] = [];
    if (next) bits.push("Your next assessment is " + next.name + " in week " + next.week + " (" + next.due + ", worth " + next.weight + ").");
    if (avg !== null) bits.push("Your recorded average is sitting at " + avg + "%.");
    if (bits.length === 0) bits.push("You haven't uploaded a school outline yet. Give me one and I'll map every assessment and topic for you.");
    return {
      reply: {
        who: "e",
        text: bits.join(" "),
        actions: [nav("Open Assessment Tracker", "/outline")],
      },
    };
  }

  // --- grades / progress ---
  if (/(grade|mark|score|progress|how am i)/.test(t)) {
    return {
      reply: {
        who: "e",
        text: "You're at " + ctx.completionPct + "% completion this term. Latest mark: an A on Stoichiometry Set 5, with Quantitative Paper 2 awaiting feedback. Record assessment scores in the tracker and I'll keep your average live.",
        actions: [nav("Open My Grades", "/grades"), nav("Assessment Tracker", "/outline")],
      },
    };
  }

  // --- messages / tutor contact ---
  if (/(message|unread|tutor|contact|reply|dr rao|ms lin|mr chen)/.test(t)) {
    const n = ctx.unreadMessages;
    return {
      reply: {
        who: "e",
        text: n > 0 ? "You have " + n + " unread message" + (n === 1 ? "" : "s") + " waiting. Want me to take you there?" : "No unread messages. You can write to any of your tutors or the Everest team - everything is monitored to keep it safe.",
        actions: [nav("Open Messages", "/messages")],
      },
    };
  }

  // --- library / recordings ---
  if (/(recording|library|notes|video|material)/.test(t)) {
    return {
      reply: {
        who: "e",
        text: "Recordings and notes live in the Library, organised by session date. The 30 June Verbal Reasoning recording was added most recently.",
        actions: [nav("Open Library", "/library")],
      },
    };
  }

  // --- support status ---
  if (/(support|request|ticket|follow up|status)/.test(t)) {
    const n = ctx.openSupportCount;
    return {
      reply: {
        who: "e",
        text: n > 0 ? "You have " + n + " support request" + (n === 1 ? "" : "s") + " in flight. Replies from the team appear on the Support page and I'll nudge them if one goes quiet." : "No open support requests. Tell me what's wrong in a sentence and I'll log one for you.",
        actions: [nav("Open Support", "/support")],
      },
    };
  }

  // --- navigation: "take me to X" / "open X" ---
  const navMatch = t.match(/(?:take me to|open|go to|show me)\s+(?:the\s+)?([a-z ]+)/);
  if (navMatch) {
    const dest = navMatch[1].trim();
    const routes: [RegExp, string, string][] = [
      [/dash/, "Dashboard", "/"],
      [/course/, "Courses", "/courses"],
      [/timetable|calendar/, "Timetable", "/timetable"],
      [/tracker|outline|assessment/, "Assessment Tracker", "/outline"],
      [/library/, "Library", "/library"],
      [/drive/, "My Drive", "/drive"],
      [/grade/, "My Grades", "/grades"],
      [/message/, "Messages", "/messages"],
      [/support/, "Support", "/support"],
      [/setting/, "Settings", "/settings"],
    ];
    const hit = routes.find(([re]) => re.test(dest));
    if (hit) {
      return { reply: { who: "e", text: "On it - here's " + hit[1] + ".", actions: [nav("Open " + hit[1], hit[2])] } };
    }
  }

  // --- study help fallback ---
  return {
    reply: {
      who: "e",
      text: "I can help with that. I can check what's due, your next class, assessments and grades, open any page, or log a problem with the Everest team - or just ask me a study question. What would you like?",
      actions: [{ label: "What's due?", kind: "nav", href: "/drive" }, nav("Next class", "/timetable"), nav("Log an issue", "/support")],
    },
  };
}
