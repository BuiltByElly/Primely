import { create } from "zustand";

interface LinkUpdateStore {
  linkId: number | null;
  setLinkId: (id: number | null) => void;
  oldName: string;
  setOldName: (oldName: string) => void;
  oldOriginalLink: string;
  setOldOriginalLink: (oldOriginalLink: string) => void;
}
export const useLinkUpdateStore = create<LinkUpdateStore>()((set) => ({
  linkId: null,
  setLinkId: (id) => set({ linkId: id }),
  oldName: "",
  setOldName: (oldName) => set({ oldName }),
  oldOriginalLink: "",
  setOldOriginalLink: (oldOriginalLink) => set({ oldOriginalLink }),
}));
