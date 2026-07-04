// Drop-in replacement for `next/link`. The pages use `<Link href="..."`>` with
// the usual anchor props (className, style, aria-*, target). React Router's Link
// uses `to`, so this maps `href` -> `to` and forwards everything else. Default
// export to match `import Link from "@/components/ui/Link"`.

import React from "react";
import { Link as RouterLink } from "react-router-dom";

type LinkProps = {
  href: string;
  children?: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export default function Link({ href, children, ...rest }: LinkProps) {
  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  );
}
