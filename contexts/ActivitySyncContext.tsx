import { Activity } from "@/types/Activity";
import React, {
    createContext,
    useCallback,
    useMemo,
    useRef,
} from "react";

type UpdateListener = (activity: Activity) => void;
type DeleteListener = (activityId: string) => void;

interface ActivitySyncContextValue {
  subscribeToActivityUpdates: (callback: UpdateListener) => () => void;
  notifyActivityUpdated: (activity: Activity) => void;
  subscribeToActivityDeleted: (callback: DeleteListener) => () => void;
  notifyActivityDeleted: (activityId: string) => void;
}

const ActivitySyncContext = createContext<ActivitySyncContextValue | null>(
  null,
);

export function useActivitySync() {
  const ctx = React.useContext(ActivitySyncContext);
  if (!ctx) {
    throw new Error(
      "useActivitySync must be used within an ActivitySyncProvider",
    );
  }
  return ctx;
}

export function ActivitySyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const updateListenersRef = useRef<Set<UpdateListener>>(new Set());
  const deleteListenersRef = useRef<Set<DeleteListener>>(new Set());

  const subscribeToActivityUpdates = useCallback((callback: UpdateListener) => {
    updateListenersRef.current.add(callback);
    return () => {
      updateListenersRef.current.delete(callback);
    };
  }, []);

  const notifyActivityUpdated = useCallback((activity: Activity) => {
    updateListenersRef.current.forEach((cb) => cb(activity));
  }, []);

  const subscribeToActivityDeleted = useCallback((callback: DeleteListener) => {
    deleteListenersRef.current.add(callback);
    return () => {
      deleteListenersRef.current.delete(callback);
    };
  }, []);

  const notifyActivityDeleted = useCallback((activityId: string) => {
    deleteListenersRef.current.forEach((cb) => cb(activityId));
  }, []);

  const value = useMemo<ActivitySyncContextValue>(
    () => ({
      subscribeToActivityUpdates,
      notifyActivityUpdated,
      subscribeToActivityDeleted,
      notifyActivityDeleted,
    }),
    [
      subscribeToActivityUpdates,
      notifyActivityUpdated,
      subscribeToActivityDeleted,
      notifyActivityDeleted,
    ],
  );

  return (
    <ActivitySyncContext.Provider value={value}>
      {children}
    </ActivitySyncContext.Provider>
  );
}
