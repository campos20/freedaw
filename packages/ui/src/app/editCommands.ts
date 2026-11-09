import { deleteClips, duplicateClips, removeTrack, splitClips } from "../model/edits";
import type { ProjectState } from "../state/store";
import type { Session } from "../state/session";

/** Clip edits shared by the toolbar and the keyboard shortcuts. */

/** The clips Split acts on: the selected clips, or every clip on the selected track. */
function splitTargets(s: ProjectState): number[] {
  const selected = [...s.selection.clips];
  if (selected.length) return selected;
  const track = s.project.tracks.find((t) => t.id === s.selection.track);
  return track?.clips.map((c) => c.id) ?? [];
}

export const canSplit = (s: ProjectState) => splitTargets(s).length > 0;
export const canDuplicate = (s: ProjectState) => s.selection.clips.size > 0;
export const canDelete = (s: ProjectState) => s.selection.clips.size > 0 || s.selection.track !== undefined;

/** Splits the split targets at the playhead. */
export function splitAtPlayhead(session: Session): boolean {
  const s = session.store.getState();
  const ids = splitTargets(s);
  if (!ids.length) return false;
  const frame = session.transport.getState().position;
  s.edit("Split", (p) => void splitClips(p, ids, frame));
  return true;
}

/** Duplicates the selected clips and selects the copies. */
export function duplicateSelection(session: Session): boolean {
  const s = session.store.getState();
  const selected = [...s.selection.clips];
  if (!selected.length) return false;
  let created: number[] = [];
  s.edit("Duplicate", (p) => void (created = duplicateClips(p, selected)));
  s.select({ clips: new Set(created) });
  return true;
}

/** Deletes the selected clips, or the selected track when no clip is selected. */
export function deleteSelection(session: Session): boolean {
  const s = session.store.getState();
  const selected = [...s.selection.clips];
  if (selected.length) s.edit("Delete clips", (p) => deleteClips(p, selected));
  else if (s.selection.track !== undefined) {
    const id = s.selection.track;
    s.edit("Delete track", (p) => removeTrack(p, id));
  } else return false;
  return true;
}
