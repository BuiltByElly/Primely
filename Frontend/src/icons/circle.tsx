import type { SVGProps } from "react";

export function Circle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <circle cx={12} cy={12} r={10} fill="none" strokeWidth={2}></circle>
    </svg>
  );
}
