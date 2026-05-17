export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name: string;
}
