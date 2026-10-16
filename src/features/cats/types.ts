// One cat the user met and photographed.
export type Cat = {
  id: string;
  // A breed id from `breeds`.
  breed: string;
  name: string | null;
  // The photo's file name in the app's photo folder. The folder's full path
  // changes between app updates on iOS, so it is never stored.
  photo: string;
  // ISO date and time, when the cat was added.
  seenAt: string;
  // Whether the phone saw a cat in the photo; null where it could not tell
  // (Android, the Simulator). Only true counts on the leaderboard.
  hasCat: boolean | null;
};
