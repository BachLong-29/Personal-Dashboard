export interface TaskLog {
  id:        string;
  taskId:    string;
  userId:    string;
  /** YYYY-MM-DD */
  date:      string;
  note?:     string;
  createdAt: string;
  updatedAt: string;
}

export interface ToggleTaskLogPayload {
  taskId: string;
  /** YYYY-MM-DD */
  date:   string;
  note?:  string;
}
