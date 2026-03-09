import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { useEffect, useState } from 'react';

interface User {
  userId: string;
  username: string;
}

export function useUser() {
  const [user, setUser] = useState<User | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(({ userId, username }) => setUser({ userId, username }))
      .catch(() => setUser(undefined))
      .finally(() => setIsLoading(false));

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        getCurrentUser()
          .then(({ userId, username }) => setUser({ userId, username }))
          .catch(() => setUser(undefined));
      } else if (payload.event === 'signedOut') {
        setUser(undefined);
      }
    });

    return unsubscribe;
  }, []);

  return { userId: user?.userId, username: user?.username, isLoading };
}
