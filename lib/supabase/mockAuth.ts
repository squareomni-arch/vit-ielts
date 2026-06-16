import { CookieOptions } from "@supabase/ssr";

export const MOCK_ACCOUNTS = [
  {
    id: "ba293401-7bf7-4a06-b168-aa8b3dc9e8f6",
    email: "admin@vit.vn",
    password: "3986483aA@",
    name: "Admin VIT",
    roles: ["administrator"],
  },
  {
    id: "ba293401-7bf7-4a06-b168-aa8b3dc9e8f6",
    email: "techlead.holy@gmail.com",
    password: "IeltsTest@2026",
    name: "Techlead Admin",
    roles: ["administrator"],
  },
  {
    id: "88da8ada-bbc2-490e-b6aa-4ddb3baafc2a",
    email: "devtest@vit.vn",
    password: "DevTest@123",
    name: "Dev Test",
    roles: ["subscriber"],
  },
  {
    id: "2ab5e2db-56a4-4098-9a0b-03a2cb4e853a",
    email: "e2e-teacher@vit.test",
    password: "E2eTeach!23",
    name: "E2E Teacher",
    roles: ["teacher"],
  },
  {
    id: "a0f128c1-1e9a-4db5-9e62-570a2a4b8891",
    email: "student1@vit.vn",
    password: "Student@123",
    name: "Student 1",
    roles: ["subscriber"],
  },
  {
    id: "b8a07c12-32a1-42db-bf0a-6c1b3f5c8892",
    email: "student2@vit.vn",
    password: "Student@123",
    name: "Student 2",
    roles: ["subscriber"],
  },
  {
    id: "c90bf8c3-43b2-4dcb-af0a-7c2a4f6d8893",
    email: "student3@vit.vn",
    password: "Student@123",
    name: "Student 3",
    roles: ["subscriber"],
  },
  {
    id: "d1ab6fc4-54c3-4edd-bf0a-8d3b5e7c8894",
    email: "student4@vit.vn",
    password: "Student@123",
    name: "Student 4",
    roles: ["subscriber"],
  },
  {
    id: "e2bcf0d5-65d4-4fde-bf0a-9e4c6f8d8895",
    email: "student5@vit.vn",
    password: "Student@123",
    name: "Student 5",
    roles: ["subscriber"],
  },
  {
    id: "f3cde1e6-76e5-4fee-bf0a-0f5d7a9e8896",
    email: "student6@vit.vn",
    password: "Student@123",
    name: "Student 6",
    roles: ["subscriber"],
  },
  {
    id: "04def2f7-87f6-4fff-bf0a-1a6e8b0f8897",
    email: "student7@vit.vn",
    password: "Student@123",
    name: "Student 7",
    roles: ["subscriber"],
  }
];

const COOKIE_NAME = "sb-mock-auth-token";

function getCookie(name: string, cookies?: Record<string, string>) {
  if (typeof window !== "undefined") {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[2]));
      } catch {
        return null;
      }
    }
  } else if (cookies) {
    const val = cookies[name];
    if (val) {
      try {
        return JSON.parse(decodeURIComponent(val));
      } catch {
        return null;
      }
    }
  }
  return null;
}

function setCookie(name: string, value: any) {
  if (typeof window === "undefined") return;
  const cookieVal = encodeURIComponent(JSON.stringify(value));
  document.cookie = `${name}=${cookieVal}; path=/; max-age=3600; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof window === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function wrapWithMockAuth(client: any, cookies?: Record<string, string>) {
  if (process.env.NEXT_PUBLIC_MOCK_DB !== "true") {
    return client;
  }

  // Override Auth
  client.auth.signInWithPassword = async ({ email, password }: any) => {
    const account = MOCK_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
    );

    if (!account) {
      return {
        data: { user: null, session: null },
        error: { message: "Invalid email or password" },
      };
    }

    const session = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: account.id,
        email: account.email,
        user_metadata: { name: account.name },
      },
    };

    setCookie(COOKIE_NAME, session);
    return { data: { user: session.user, session }, error: null };
  };

  client.auth.getSession = async () => {
    const session = getCookie(COOKIE_NAME, cookies);
    return { data: { session }, error: null };
  };

  client.auth.onAuthStateChange = (callback: any) => {
    const session = getCookie(COOKIE_NAME, cookies);
    
    // Defer callback execution to simulate real async auth flow triggers
    if (typeof window !== "undefined") {
      setTimeout(() => {
        callback(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      }, 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {},
        },
      },
    };
  };

  client.auth.signOut = async () => {
    deleteCookie(COOKIE_NAME);
    return { error: null };
  };

  // Override Database Query for 'users'
  const originalFrom = client.from;
  client.from = (table: string) => {
    if (table === "users") {
      return {
        select: (columns: string) => ({
          eq: (field: string, val: any) => ({
            single: async () => {
              const account = MOCK_ACCOUNTS.find((a) => a.id === val);
              if (account) {
                return {
                  data: {
                    id: account.id,
                    email: account.email,
                    name: account.name,
                    roles: account.roles,
                    is_pro: true,
                    pro_expiration_date: "2030-01-01",
                    pro_skills: null,
                  },
                  error: null,
                };
              }
              return { data: null, error: { message: "User not found" } };
            },
          }),
        }),
        update: (data: any) => ({
          eq: (field: string, val: any) => ({
            select: (columns: string) => ({
              single: async () => {
                const account = MOCK_ACCOUNTS.find((a) => a.id === val);
                return {
                  data: {
                    id: val,
                    target_score: data.target_score || null,
                  },
                  error: null,
                };
              },
            }),
          }),
        }),
      };
    }
    return originalFrom.apply(client, [table]);
  };

  return client;
}
