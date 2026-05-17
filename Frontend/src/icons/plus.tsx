import type { SVGProps } from "react";

export function Plus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      viewBox="0 0 8 8"
      {...props}
    >
      <path d="M1 5V4h5v1M3 7V2h1v5"></path>
    </svg>
  );
}
