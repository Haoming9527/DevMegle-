// TypeScript declarations for external libraries

declare global {
  interface Window {
    feather?: {
      replace: () => void;
    };
    VANTA?: {
      GLOBE: (options: any) => void;
    };
  }
}

export {};
