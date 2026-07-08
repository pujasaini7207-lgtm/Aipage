import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables - NO fallbacks, must be explicitly configured
const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

// Check if keys are properly configured. If not, run in fallback "Local DB" mode using localStorage.
export let isMockMode = !SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("placeholder");

if (isMockMode) {
  console.warn(
    "⚠️ Supabase Configuration Missing/Incomplete.\n" +
    "Working in secure Local Sandbox Mode with localStorage and local state.\n" +
    "To connect your live database, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Environment Variables (Production)."
  );
}

export const supabase = !isMockMode ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!) : null;

// Firebase compatible enum and handlers for flawless compatibility
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('[Supabase Engine Error]: ', error, 'Operation:', operationType, 'Path:', path);
  throw error;
}

// Emulating auth listener and custom structures
class SupabaseAuthMock {
  private listeners: ((user: any) => void)[] = [];
  public currentUser: any = null;

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    if (!isMockMode && supabase) {
      try {
        // Fetch initial session state
        const { data: { session } } = await supabase.auth.getSession();
        this.currentUser = session?.user ? {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0],
        } : null;
        this.triggerListeners();

        // Listen for auth state dynamics
        supabase.auth.onAuthStateChange((_event, session) => {
          this.currentUser = session?.user ? {
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0],
          } : null;
          this.triggerListeners();
        });
        return;
      } catch (err) {
        console.warn("⚠️ Remote Supabase connection failed. Falling back to Local Sandbox Mode.", err);
        isMockMode = true; // Downgrade dynamically
      }
    }

    // Local Sandbox Fallback Mode
    const savedUser = localStorage.getItem("lunito_local_user");
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        this.currentUser = null;
      }
    }
    this.triggerListeners();
  }

  public triggerListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  public subscribe(cb: (user: any) => void) {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public setLocalUser(user: any) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem("lunito_local_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("lunito_local_user");
    }
    this.triggerListeners();
  }
}

export const auth = new SupabaseAuthMock();
export const db = { type: "db" }; // Database pointer

// Firebase Authentication Methods Translation
export function onAuthStateChanged(authInstance: any, callback: (user: any) => void) {
  return auth.subscribe(callback);
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, password: any) {
  if (!isMockMode && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return {
        user: {
          uid: data.user?.id,
          email: data.user?.email,
          displayName: data.user?.user_metadata?.displayName || data.user?.email?.split('@')[0]
        }
      };
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        console.warn("⚠️ Supabase authentication failed with a network error. Falling back to local accounts.");
        isMockMode = true;
      } else {
        throw err;
      }
    }
  }

  // Local flow
  const accountsRaw = localStorage.getItem("lunito_local_accounts") || "[]";
  const accounts = JSON.parse(accountsRaw);
  const existing = accounts.find((acc: any) => acc.email.toLowerCase() === email.toLowerCase());
  if (!existing || existing.password !== password) {
    throw new Error("Invalid username or password (Local Fallback)");
  }
  const loggedUser = {
    uid: existing.uid,
    email: existing.email,
    displayName: existing.displayName || existing.email.split('@')[0],
  };
  auth.setLocalUser(loggedUser);
  return { user: loggedUser };
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, password: any) {
  if (!isMockMode && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName: email.split('@')[0]
          }
        }
      });
      if (error) throw error;
      return {
        user: {
          uid: data.user?.id,
          email: data.user?.email,
          displayName: data.user?.user_metadata?.displayName || data.user?.email?.split('@')[0]
        }
      };
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        console.warn("⚠️ Supabase creation failed with a network error. Falling back to local account creation.");
        isMockMode = true;
      } else {
        throw err;
      }
    }
  }

  const accountsRaw = localStorage.getItem("lunito_local_accounts") || "[]";
  const accounts = JSON.parse(accountsRaw);
  if (accounts.some((acc: any) => acc.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already exists locally!");
  }
  const newUid = "local_uid_" + Math.random().toString(36).substr(2, 9);
  const newUser = {
    uid: newUid,
    email,
    password,
    displayName: email.split('@')[0],
  };
  accounts.push(newUser);
  localStorage.setItem("lunito_local_accounts", JSON.stringify(accounts));
  
  const loggedUser = {
    uid: newUid,
    email,
    displayName: newUser.displayName
  };
  auth.setLocalUser(loggedUser);
  return { user: loggedUser };
}

export async function signOut(authInstance: any) {
  auth.setLocalUser(null);
  if (!isMockMode && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase remote signOut warning:", err);
    }
  }
}

export class GoogleAuthProvider {
  public setCustomParameters(params: any): void {}
}

export async function signInWithPopup(authInstance: any, provider: any) {
  if (!isMockMode && supabase) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;

      // IMPORTANT: signInWithOAuth navigates the browser to Google's
      // account picker. We must stop here and NOT fall through to the
      // sandbox bypass below - otherwise a fake local account gets logged
      // in instantly, before Google's page ever has a chance to show.
      // The real user session is picked up later by onAuthStateChange
      // once Google redirects back to this app.
      return { user: null };
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        console.warn("⚠️ Supabase popup auth failed with a network error. Loading guest bypass.");
        isMockMode = true;
      } else {
        throw err;
      }
    }
  }

  // Sandbox default bypass - only reached when running in mock mode
  // (no real Supabase project configured) or after a genuine network failure.
  const loggedUser = {
    uid: "local_google_uid_12345",
    email: "sandbox.scholar@example.com",
    displayName: "Sandbox Scholar"
  };
  auth.setLocalUser(loggedUser);
  return { user: loggedUser };
}

// Firestore Database Document Mapping Layer
export function doc(dbInstance: any, table: string, id: string) {
  return {
    type: "doc" as const,
    table,
    id
  };
}

export function collection(dbInstance: any, table: string) {
  return {
    type: "collection" as const,
    table
  };
}

export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

export function query(collectionObj: any, ...constraints: any[]) {
  return {
    type: "query" as const,
    table: collectionObj.table,
    filters: constraints
  };
}

function parseTablePath(rawTable: string): { tableName: string; extra: Record<string, any> } {
  let tableName = rawTable;
  const extra: Record<string, any> = {};
  if (tableName.startsWith("chats/") && tableName.endsWith("/messages")) {
    const parts = tableName.split("/");
    extra.chat_id = parts[1];
    tableName = "messages";
  }
  return { tableName, extra };
}

export async function getDoc(docRef: any) {
  if (!isMockMode && supabase) {
    try {
      const { tableName } = parseTablePath(docRef.table);
      const { data, error } = await supabase
        .from(tableName)
        .select('id, payload')
        .eq('id', docRef.id)
        .maybeSingle();

      if (error) throw error;
      const merged = data ? { id: data.id, ...(data.payload || {}) } : null;
      return {
        exists: () => !!data,
        id: docRef.id,
        data: () => merged
      };
    } catch (err: any) {
      console.warn(`[Supabase Engine] getDoc remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  const key = `local_db_${docRef.table}_${docRef.id}`;
  const value = localStorage.getItem(key);
  const parsed = value ? JSON.parse(value) : null;
  return {
    exists: () => !!parsed,
    id: docRef.id,
    data: () => parsed
  };
}

export async function setDoc(docRef: any, data: any) {
  if (!isMockMode && supabase) {
    try {
      const { tableName, extra } = parseTablePath(docRef.table);
      const row: any = {
        id: docRef.id,
        payload: data,
        updated_at: new Date().toISOString(),
        ...extra
      };
      if (auth.currentUser?.uid) {
        row.owner_id = auth.currentUser.uid;
      }
      const { error } = await supabase
        .from(tableName)
        .upsert(row);
      if (error) throw error;
      return;
    } catch (err: any) {
      console.warn(`[Supabase Engine] setDoc remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  const key = `local_db_${docRef.table}_${docRef.id}`;
  localStorage.setItem(key, JSON.stringify(data));
}

export async function updateDoc(docRef: any, data: any) {
  if (!isMockMode && supabase) {
    try {
      const { tableName } = parseTablePath(docRef.table);
      // Firestore's updateDoc merges the given fields onto the existing
      // document rather than replacing it. Since data lives in a JSONB
      // column here, fetch the current payload first and merge client-side.
      const { data: existingRow, error: fetchError } = await supabase
        .from(tableName)
        .select('payload')
        .eq('id', docRef.id)
        .maybeSingle();
      if (fetchError) throw fetchError;

      const mergedPayload = { ...(existingRow?.payload || {}), ...data };
      const { error } = await supabase
        .from(tableName)
        .update({ payload: mergedPayload, updated_at: new Date().toISOString() })
        .eq('id', docRef.id);
      if (error) throw error;
      return;
    } catch (err: any) {
      console.warn(`[Supabase Engine] updateDoc remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  const key = `local_db_${docRef.table}_${docRef.id}`;
  const existing = localStorage.getItem(key);
  const existingObj = existing ? JSON.parse(existing) : {};
  const updated = { ...existingObj, ...data };
  localStorage.setItem(key, JSON.stringify(updated));
}

export async function addDoc(collectionObj: any, data: any) {
  const generatedId = "doc_" + Math.random().toString(36).substr(2, 9);
  const payload = { id: generatedId, ...data };

  if (!isMockMode && supabase) {
    try {
      const { tableName, extra } = parseTablePath(collectionObj.table);
      const row: any = {
        id: generatedId,
        payload: data,
        updated_at: new Date().toISOString(),
        ...extra
      };
      if (auth.currentUser?.uid) {
        row.owner_id = auth.currentUser.uid;
      }
      const { data: inserted, error } = await supabase
        .from(tableName)
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      const finalId = inserted?.id || generatedId;
      const mergedData = { id: finalId, ...(inserted?.payload || data) };
      return {
        id: finalId,
        data: () => mergedData
      };
    } catch (err: any) {
      console.warn(`[Supabase Engine] addDoc remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  const key = `local_db_${collectionObj.table}_${generatedId}`;
  localStorage.setItem(key, JSON.stringify(payload));

  const indexKey = `local_db_index_${collectionObj.table}`;
  const index = JSON.parse(localStorage.getItem(indexKey) || "[]");
  index.push(generatedId);
  localStorage.setItem(indexKey, JSON.stringify(index));

  return {
    id: generatedId,
    data: () => payload
  };
}

export async function getDocs(queryObj: any) {
  if (!isMockMode && supabase) {
    try {
      const { tableName, extra } = parseTablePath(queryObj.table);

      let builder: any = supabase.from(tableName).select('id, payload');
      if (extra.chat_id) {
        builder = builder.eq('chat_id', extra.chat_id);
      }

      if (queryObj.filters && Array.isArray(queryObj.filters)) {
        for (const filter of queryObj.filters) {
          if (filter.op === "==") {
            // Filter on a key inside the JSONB payload column
            builder = builder.eq(`payload->>${filter.field}`, filter.value);
          }
        }
      }
      const { data, error } = await builder;
      if (error) throw error;

      const docs = (data || []).map((row: any) => ({
        id: row.id,
        data: () => ({ id: row.id, ...(row.payload || {}) })
      }));

      return {
        forEach: (callback: (doc: any) => void) => {
          docs.forEach(callback);
        },
        docs
      };
    } catch (err: any) {
      console.warn(`[Supabase Engine] getDocs remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  const indexKey = `local_db_index_${queryObj.table}`;
  const index = JSON.parse(localStorage.getItem(indexKey) || "[]");

  const results: any[] = [];
  for (const docId of index) {
    const value = localStorage.getItem(`local_db_${queryObj.table}_${docId}`);
    if (value) {
      try {
        const item = JSON.parse(value);
        let match = true;
        if (queryObj.filters && Array.isArray(queryObj.filters)) {
          for (const filter of queryObj.filters) {
              if (filter.op === "==") {
                if (item[filter.field] !== filter.value) {
                  match = false;
                }
              }
          }
        }
        if (match) {
          results.push({
            id: docId,
            data: () => item
          });
        }
      } catch {
        // Ignore parse issues
      }
    }
  }

  return {
    forEach: (callback: (doc: any) => void) => {
      results.forEach(callback);
    },
    docs: results
  };
}

export async function deleteDoc(docRef: any) {
  if (!isMockMode && supabase) {
    try {
      const { tableName } = parseTablePath(docRef.table);
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', docRef.id);
      if (error) throw error;
      return;
    } catch (err: any) {
      console.warn(`[Supabase Engine] deleteDoc remote failed, falling back to local:`, err);
      if (err.message === "Failed to fetch" || err.status === 0 || String(err).includes("fetch")) {
        isMockMode = true;
      }
    }
  }

  localStorage.removeItem(`local_db_${docRef.table}_${docRef.id}`);

  const indexKey = `local_db_index_${docRef.table}`;
  const index = JSON.parse(localStorage.getItem(indexKey) || "[]");
  const updatedIndex = index.filter((id: string) => id !== docRef.id);
  localStorage.setItem(indexKey, JSON.stringify(updatedIndex));
}
