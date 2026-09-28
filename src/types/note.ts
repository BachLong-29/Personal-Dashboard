export interface Note {
  id: string;
  content: string;
  /** ISO string when the note has been dealt with; absent while it is open. */
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotePayload {
  content: string;
}

export interface UpdateNotePayload {
  archived: boolean;
}
