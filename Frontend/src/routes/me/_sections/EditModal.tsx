import Spinner from "#/components/Spinner";
import { useUserStore } from "#/store/AuthStore";
import { useLinkUpdateStore } from "#/store/LinkStore";
import { useToastStore } from "#/store/ToastStore";
import { authFetchData } from "#/utils/authFetch";
import { capitalize } from "#/utils/capitalize";
import { validateLink } from "#/utils/validator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

interface EditModalInterface {
  link_id: number;
  oldName: string;
  oldOriginalLink: string;
}

export default function EditModal(props: EditModalInterface) {
  const user = useUserStore((s) => s.user);
  if (!user) return null;
  const { addToast } = useToastStore();

  const initialState: LinkUpdate = {
    name: props.oldName,
    original_link: props.oldOriginalLink,
  };

  const [formData, setFormData] = useState<LinkUpdate>(initialState);
  const { setLinkId, setOldName, setOldOriginalLink } = useLinkUpdateStore();
  const [state, setState] = useState<"success" | "error" | "loading" | "none">(
    "none",
  );
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Build payload based on type

      await authFetchData(`/api/me/links/${props.link_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    onSuccess: () => {
      setFormData(initialState);
      setState("success");
      addToast({
        state: "success",
        text: "Updated link successfully!",
      });
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["linkData"],
        });
        queryClient.invalidateQueries({
          queryKey: ["linkDatum"],
        });
        setLinkId(null);
        setOldName("");
        setOldOriginalLink("");
      }, 500);
    },
    onError: () => {
      setState("error");
      addToast({
        state: "error",
        text: "Oops, an error occurred while trying to update link.",
      });
      setTimeout(() => setState("none"), 1500);
    },
  });

  const handleSubmit = async () => {
    setState("loading");
    if (formData.name.trim() === "" || formData.name.trim().length > 50) {
      setState("error");
      addToast({ state: "warning", text: "Name is empty or above 50" });
      setTimeout(() => setState("none"), 1500);
      return;
    } else if (!validateLink(formData.original_link)) {
      setState("error");
      addToast({
        state: "warning",
        text: "Original Link is not a valid link",
      });

      setTimeout(() => setState("none"), 1500);
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="w-screen h-screen fixed z-10">
      <div className="w-full h-full fixed bg-black/30" />
      <div className="flex flex-col justify-center h-full items-center">
        <div className="bg-background z-3 flex flex-col gap-6 w-xl p-5 rounded-lg">
          <div>
            <p className="text-3xl font-manrope mb-10">
              Update Link - {capitalize(props.oldName)}
            </p>
            <p className="text-xl mb-2">Name</p>
            <input
              type={props.oldName}
              required
              placeholder="some-cool-name"
              className="w-full focus:outline-none text-foreground border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter/40"
              value={formData.name}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
            />
          </div>
          <div>
            <p className="text-xl mb-2">Original Link</p>
            <input
              type="text"
              required
              placeholder="some-cool-long-link"
              className="w-full focus:outline-none text-foreground border border-foreground rounded-lg p-3 transition-colors duration-200 focus-within:border-primary bg-neutral-lighter/40"
              value={formData.original_link}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  original_link: e.target.value,
                }));
              }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setLinkId(null);
                setOldName("");
                setOldOriginalLink("");
              }}
              className="text-red-700 bg-red-600/20 p-2 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Cancel
            </button>
            <button
              className={`h-10 px-4 rounded-lg transition-colors
                ${state === "none" && "bg-primary hover:bg-primary-hover"}
                ${state === "error" && "bg-red-600 disabled:hover:bg-red-600"}
                ${state === "success" && "bg-green-500 disabled:hover:bg-green-500"}
                ${state === "loading" && "bg-neutral-lighter disabled:hover:bg-neutral-lighter"}
                `}
              onClick={handleSubmit}
              disabled={state !== "none"}
            >
              {state === "none" && "Update"}
              {state === "loading" && (
                <Spinner
                  innerClassName="border-t-primary"
                  trackClassName="bg-primary/20"
                  outerClassName="bg-neutral-lighter"
                  size="sm"
                  thickness={5}
                />
              )}
              {state === "success" && <CheckCircle />}
              {state === "error" && <TriangleAlertIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
