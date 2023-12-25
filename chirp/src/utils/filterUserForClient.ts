import type { User } from "@clerk/backend";

export const filterUserForClient = (user: User) => ({
  id: user.id,
  name: user.username,
  profilePicture: user.imageUrl,
});
