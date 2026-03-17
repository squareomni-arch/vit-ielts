import { createContext, useContext, useMemo } from "react";

export type MenuItem = {
  key: number;
  label: string | React.ReactNode;
  uri: string;
  children?: Array<MenuItem>;
};

export type MasterData = {
  websiteOptions: {
    websiteOptionsFields: {
      generalSettings: {
        favicon: {
          node: {
            sourceUrl: string;
          };
        };
        logo: {
          node: {
            sourceUrl: string;
          };
        };
        facebook: string;
        email: string;
        zalo: string;
        phoneNumber: string;
        preventCopy: boolean;
        buyProLink: string;
        bannerTestResult?: {
          node: {
            sourceUrl: string;
          };
        } | null;
      };
    };
  };
  allSettings: {
    generalSettingsTitle: string;
  };
  menuData: {
    [key: string]: Array<MenuItem>;
  };
  viewer?: {
    id: string;
    name: string;
    roles: {
      nodes: Array<{ name: string }>;
    };
    userData: {
      avatar?: {
        node: {
          mediaDetails: {
            sizes: Array<{
              sourceUrl: string;
              width: string;
            }>;
          };
          srcSet: string;
        };
      } | null;
      isPro: boolean;
      proExpirationDate?: string | null;
      proSkills?: string[] | null;
    };
  } | null;
  // userCredentials removed — Supabase Auth manages session internally
};

type Context = { masterData: MasterData };

const defaultMasterData: MasterData = {
  websiteOptions: {
    websiteOptionsFields: {
      generalSettings: {
        favicon: { node: { sourceUrl: "" } },
        logo: { node: { sourceUrl: "" } },
        facebook: "",
        email: "",
        zalo: "",
        phoneNumber: "",
        preventCopy: false,
        buyProLink: "",
      },
    },
  },
  allSettings: {
    generalSettingsTitle: "",
  },
  menuData: {},
};

const AppContext = createContext<Context>({ masterData: defaultMasterData });

export const useAppContext = () => {
  const context = useContext(AppContext);
  // Đảm bảo luôn có masterData, fallback về default nếu undefined
  return {
    masterData: context?.masterData || defaultMasterData,
  };
};

export const AppProvider = ({
  children,
  masterData,
}: {
  children: React.ReactNode;
  masterData: MasterData;
}) => {
  const contextValue = useMemo(() => ({ masterData }), [masterData]);
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
