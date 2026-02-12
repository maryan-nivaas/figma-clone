"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import type { Color, Layer, Point } from "~/types";

type Presence = {
  selection: string[];
  cursor: Point | null;
  penColor: Color | null;
  pencilDraft: number[][] | null;
};

type LocalUser = {
  connectionId: number;
  info: {
    name: string;
  };
  presence: Presence;
};

type RootStorage = {
  roomColor: Color;
  layers: LiveMap<string, LiveObject<Layer>>;
  layerIds: LiveList<string>;
};

type ImmutableRootStorage = {
  roomColor: Color;
  layers: ReadonlyMap<string, Layer>;
  layerIds: readonly string[];
};

type Snapshot = {
  storage: RootStorage;
  presence: Presence;
};

type MutationCtx = {
  storage: {
    get: <K extends keyof RootStorage>(key: K) => RootStorage[K];
    set: <K extends keyof RootStorage>(key: K, value: RootStorage[K]) => void;
  };
  self: LocalUser;
  setMyPresence: (
    patch: Partial<Presence>,
    options?: { addToHistory?: boolean },
  ) => void;
};

type LocalState = {
  root: RootStorage;
  self: LocalUser;
  others: LocalUser[];
  past: Snapshot[];
  future: Snapshot[];
  pauseDepth: number;
  pausedSnapshot: Snapshot | null;
  pausedChanged: boolean;
};

type RoomContextType = {
  version: number;
  getState: () => LocalState;
  runMutation: <T>(fn: (ctx: MutationCtx) => T) => T;
  setMyPresence: (
    patch: Partial<Presence>,
    options?: { addToHistory?: boolean },
  ) => void;
  pauseHistory: () => void;
  resumeHistory: () => void;
  undo: () => void;
  redo: () => void;
};

const RoomContext = createContext<RoomContextType | null>(null);

function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneStorage(root: RootStorage): RootStorage {
  const nextLayers = new LiveMap<string, LiveObject<Layer>>();
  for (const [id, layer] of root.layers) {
    nextLayers.set(id, new LiveObject<Layer>(deepClone(layer.toObject())));
  }
  return {
    roomColor: deepClone(root.roomColor),
    layers: nextLayers,
    layerIds: new LiveList<string>(root.layerIds.toArray()),
  };
}

function clonePresence(presence: Presence): Presence {
  return {
    selection: [...presence.selection],
    cursor: presence.cursor ? { ...presence.cursor } : null,
    penColor: presence.penColor ? { ...presence.penColor } : null,
    pencilDraft: presence.pencilDraft
      ? presence.pencilDraft.map((point) => [...point])
      : null,
  };
}

function createSnapshot(state: LocalState): Snapshot {
  return {
    storage: cloneStorage(state.root),
    presence: clonePresence(state.self.presence),
  };
}

function restoreSnapshot(state: LocalState, snapshot: Snapshot) {
  state.root = cloneStorage(snapshot.storage);
  state.self = {
    ...state.self,
    presence: clonePresence(snapshot.presence),
  };
}

function serializeStorage(root: RootStorage): string {
  const layers: Record<string, Layer> = {};
  for (const [id, layer] of root.layers) {
    layers[id] = deepClone(layer.toObject());
  }
  return JSON.stringify({
    roomColor: root.roomColor,
    layerIds: root.layerIds.toArray(),
    layers,
  });
}

function serializePresence(presence: Presence): string {
  return JSON.stringify(presence);
}

function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("Room hooks must be used inside RoomProvider");
  }
  return context;
}

function toImmutableRoot(root: RootStorage): ImmutableRootStorage {
  return {
    roomColor: { ...root.roomColor },
    layers: root.layers.toImmutable() as ReadonlyMap<string, Layer>,
    layerIds: root.layerIds.toArray(),
  };
}

export function LiveblocksProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function ClientSideSuspense({
  children,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children}</>;
}

export function RoomProvider({
  id,
  initialPresence,
  initialStorage,
  children,
}: {
  id: string;
  initialPresence: Presence;
  initialStorage: RootStorage;
  children: ReactNode;
}) {
  const roomIdRef = useRef<string>(id);
  const [version, setVersion] = useState(0);
  const stateRef = useRef<LocalState>({
    root: cloneStorage(initialStorage),
    self: {
      connectionId: 1,
      info: { name: "You" },
      presence: clonePresence(initialPresence),
    },
    others: [],
    past: [],
    future: [],
    pauseDepth: 0,
    pausedSnapshot: null,
    pausedChanged: false,
  });

  if (roomIdRef.current !== id) {
    roomIdRef.current = id;
    stateRef.current = {
      root: cloneStorage(initialStorage),
      self: {
        connectionId: 1,
        info: { name: "You" },
        presence: clonePresence(initialPresence),
      },
      others: [],
      past: [],
      future: [],
      pauseDepth: 0,
      pausedSnapshot: null,
      pausedChanged: false,
    };
  }

  const commitRender = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const runMutation = useCallback(
    <T,>(fn: (ctx: MutationCtx) => T): T => {
      const state = stateRef.current;
      const storageBefore = serializeStorage(state.root);
      const presenceBefore = serializePresence(state.self.presence);
      const snapshotBefore = createSnapshot(state);
      let presenceWantsHistory = false;

      const storageApi: MutationCtx["storage"] = {
        get(key) {
          return stateRef.current.root[key];
        },
        set(key, value) {
          stateRef.current.root[key] = value;
        },
      };

      const result = fn({
        storage: storageApi,
        self: state.self,
        setMyPresence(patch, options) {
          state.self.presence = {
            ...state.self.presence,
            ...patch,
          };
          if (options?.addToHistory) {
            presenceWantsHistory = true;
          }
        },
      });

      const storageAfter = serializeStorage(state.root);
      const presenceAfter = serializePresence(state.self.presence);
      const storageChanged = storageBefore !== storageAfter;
      const presenceChanged = presenceBefore !== presenceAfter;
      const changed = storageChanged || presenceChanged;

      if (changed) {
        const shouldTrackHistory = storageChanged || presenceWantsHistory;

        if (shouldTrackHistory) {
          if (state.pauseDepth > 0) {
            if (!state.pausedSnapshot) {
              state.pausedSnapshot = snapshotBefore;
            }
            state.pausedChanged = true;
          } else {
            state.past.push(snapshotBefore);
            state.future = [];
          }
        }

        commitRender();
      }

      return result;
    },
    [commitRender],
  );

  const setMyPresence = useCallback(
    (patch: Partial<Presence>, options?: { addToHistory?: boolean }) => {
      runMutation(({ setMyPresence }) => {
        setMyPresence(patch, options);
      });
    },
    [runMutation],
  );

  const pauseHistory = useCallback(() => {
    const state = stateRef.current;
    if (state.pauseDepth === 0) {
      state.pausedSnapshot = createSnapshot(state);
      state.pausedChanged = false;
    }
    state.pauseDepth += 1;
  }, []);

  const resumeHistory = useCallback(() => {
    const state = stateRef.current;
    if (state.pauseDepth === 0) return;

    state.pauseDepth -= 1;

    if (state.pauseDepth === 0) {
      if (state.pausedChanged && state.pausedSnapshot) {
        state.past.push(state.pausedSnapshot);
        state.future = [];
        commitRender();
      }
      state.pausedSnapshot = null;
      state.pausedChanged = false;
    }
  }, [commitRender]);

  const undo = useCallback(() => {
    const state = stateRef.current;
    const previous = state.past.pop();
    if (!previous) return;

    state.future.push(createSnapshot(state));
    restoreSnapshot(state, previous);
    commitRender();
  }, [commitRender]);

  const redo = useCallback(() => {
    const state = stateRef.current;
    const next = state.future.pop();
    if (!next) return;

    state.past.push(createSnapshot(state));
    restoreSnapshot(state, next);
    commitRender();
  }, [commitRender]);

  const value = useMemo<RoomContextType>(
    () => ({
      version,
      getState: () => stateRef.current,
      runMutation,
      setMyPresence,
      pauseHistory,
      resumeHistory,
      undo,
      redo,
    }),
    [
      version,
      runMutation,
      setMyPresence,
      pauseHistory,
      resumeHistory,
      undo,
      redo,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useMutation<TArgs extends unknown[], TResult>(
  callback: (ctx: MutationCtx, ...args: TArgs) => TResult,
  deps: unknown[] = [],
) {
  const room = useRoomContext();

  return useCallback(
    (...args: TArgs) => room.runMutation((ctx) => callback(ctx, ...args)),
    [room, callback, ...deps],
  );
}

export function useStorage<T>(
  selector: (root: ImmutableRootStorage) => T,
  isEqual?: (a: T, b: T) => boolean,
) {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;

  const selected = selector(toImmutableRoot(room.getState().root));
  const ref = useRef(selected);
  const equal = isEqual ?? Object.is;

  if (!equal(ref.current, selected)) {
    ref.current = selected;
  }

  return ref.current;
}

export function useSelf(): LocalUser;
export function useSelf<T>(selector: (self: LocalUser) => T): T;
export function useSelf<T>(selector?: (self: LocalUser) => T) {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  const self = room.getState().self;
  return selector ? selector(self) : self;
}

export function useOthers() {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  return room.getState().others;
}

export function useOthersConnectionIds() {
  const others = useOthers();
  return others.map((other) => other.connectionId);
}

export function useOthersMapped<T>(
  selector: (other: LocalUser) => T,
  _isEqual?: (a: T, b: T) => boolean,
) {
  const others = useOthers();
  return others.map((other) => [other.connectionId, selector(other)] as const);
}

export function useOther<T>(
  connectionId: number,
  selector: (other: LocalUser) => T,
) {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  const other = room
    .getState()
    .others.find((item) => item.connectionId === connectionId);
  return other ? selector(other) : null;
}

export function useMyPresence() {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  const presence = room.getState().self.presence;

  const update = useCallback(
    (patch: Partial<Presence>, options?: { addToHistory?: boolean }) => {
      room.setMyPresence(patch, options);
    },
    [room],
  );

  return [presence, update] as const;
}

export function useHistory() {
  const room = useRoomContext();
  return {
    undo: room.undo,
    redo: room.redo,
    pause: room.pauseHistory,
    resume: room.resumeHistory,
  };
}

export function useCanUndo() {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  return room.getState().past.length > 0;
}

export function useCanRedo() {
  const room = useRoomContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  room.version;
  return room.getState().future.length > 0;
}

export function shallow<T>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!Object.is(aObj[key], bObj[key])) return false;
  }
  return true;
}
