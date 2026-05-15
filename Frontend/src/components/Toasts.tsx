import { useToastStore } from "#/store/ToastStore";
import { AlertTriangle, BadgeInfo, CheckCircle, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const Toasts = () => {
  const { toasts, removeToast } = useToastStore();
  const containerRef = useRef<HTMLUListElement>(null!);
  const prevLengthRef = useRef(0);
  const { contextSafe } = useGSAP({ scope: containerRef });

  const animateOut = contextSafe((id: string) => {
    gsap.to(`#toast-${id}`, {
      opacity: 0,
      x: 20,
      duration: 0.2,
      onComplete: () => removeToast(id),
    });
  });

  useGSAP(
    () => {
      if (toasts.length > prevLengthRef.current) {
        gsap.from(".toast:last-child", {
          opacity: 0,
          y: 20,
          duration: 0.1,
        });
      }
      prevLengthRef.current = toasts.length;
    },
    {
      scope: containerRef,
      dependencies: [toasts],
    },
  );

  useEffect(() => {
    if (toasts.length === 0) return;
    const timeOut = setTimeout(() => {
      animateOut(toasts[0].id as string);
    }, 3500);

    return () => {
      clearTimeout(timeOut);
    };
  });

  return (
    <div className="fixed z-50 right-0 bottom-5 lg:right-5">
      <div>
        <ul className="flex flex-col gap-2" ref={containerRef}>
          {toasts.map((toast) => (
            <li key={toast.id} className="toast" id={`toast-${toast.id}`}>
              {toast.state === "info" && (
                <div className="bg-foreground/23 p-3 w-full rounded-lg border border-foreground backdrop-blur-md lg:w-md">
                  <p className="flex justify-between items-center pb-2">
                    <span className="flex gap-1 items-center">
                      <BadgeInfo className="text-foreground" />
                      Info
                    </span>
                    <span
                      className="hover:bg-foreground/20 transition-colors p-1 rounded-lg"
                      onClick={() => animateOut(toast.id as string)}
                    >
                      <X className="text-foreground" size={20} />
                    </span>
                  </p>
                  <hr className="opacity-20 text-foreground" />
                  <p className="mt-3">{toast.text}</p>
                </div>
              )}

              {toast.state === "error" && (
                <div className="text-red-600 bg-red-600/23 p-3 w-full rounded-lg border border-red-600 backdrop-blur-md lg:w-md">
                  <p className="flex justify-between items-center pb-2">
                    <span className="flex gap-1 items-center">
                      <AlertTriangle className="text-red-600" />
                      Error
                    </span>
                    <span
                      className="hover:bg-red-600/20 transition-colors p-1 rounded-lg"
                      onClick={() => animateOut(toast.id as string)}
                    >
                      <X className="text-red-600" size={20} />
                    </span>
                  </p>
                  <hr className="opacity-20 text-red-600" />
                  <p className="mt-3">{toast.text}</p>
                </div>
              )}

              {toast.state === "success" && (
                <div className="text-green-500 bg-green-500/23 p-3 w-full rounded-lg border border-green-500 backdrop-blur-md lg:w-md">
                  <p className="flex justify-between items-center pb-2">
                    <span className="flex gap-1 items-center">
                      <CheckCircle className="text-green-500" />
                      Success
                    </span>
                    <span
                      className="hover:bg-green-500/20 transition-colors p-1 rounded-lg"
                      onClick={() => animateOut(toast.id as string)}
                    >
                      <X className="text-green-500" size={20} />
                    </span>
                  </p>
                  <hr className="opacity-20 text-green-500" />
                  <p className="mt-3">{toast.text}</p>
                </div>
              )}

              {toast.state === "warning" && (
                <div className="text-primary bg-primary/23 p-3 w-full rounded-lg border border-primary backdrop-blur-md lg:w-md">
                  <p className="flex justify-between items-center pb-2">
                    <span className="flex gap-1 items-center">
                      <AlertTriangle className="text-primary" />
                      Warning
                    </span>
                    <span
                      className="hover:bg-primary/20 transition-colors p-1 rounded-lg"
                      onClick={() => animateOut(toast.id as string)}
                    >
                      <X className="text-primary" size={20} />
                    </span>
                  </p>
                  <hr className="opacity-20 text-primary" />
                  <p className="mt-3">{toast.text}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Toasts;
