import { reddit, context } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required to submit a custom post');
  }

  return await reddit.submitCustomPost({
    subredditName: subredditName,
    title: 'devils-game',
    entry: 'default',
  });
};