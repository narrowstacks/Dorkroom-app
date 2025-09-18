import { ScrollViewStyleReset } from "expo-router/html";

// This file is web-specific and will be used by Expo Router on the web.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <title>Dorkroom</title>
        <meta name="description" content="Dorkroom" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* iOS Safari viewport fix - simplified approach using dvh */
            html, body { 
              margin: 0; 
              padding: 0; 
              height: 100%;
              width: 100%;
              overflow-x: hidden;
            }
            
            /* Standard approach with dvh fallback */
            #root { 
              height: 100vh; /* Fallback for older browsers */
              width: 100%;
              display: flex;
              flex-direction: column;
            }
            
            /* Modern dynamic viewport height support */
            @supports (height: 100dvh) {
              #root {
                height: 100dvh;
              }
            }
            
            /* iOS Safari specific fixes */
            @supports (-webkit-touch-callout: none) {
              html, body {
                height: -webkit-fill-available;
              }
              
              #root {
                height: -webkit-fill-available;
              }
              
              /* Ensure all React Native Web containers use full height */
              #root > div,
              #root > div > div {
                height: 100%;
                flex: 1;
              }
            }
            
            /* Mobile scrolling optimizations */
            @media screen and (max-width: 768px) {
              body {
                -webkit-overflow-scrolling: touch;
              }
            }
          `,
          }}
        />
      </head>
      <body>
        {/* This ensures any routing events are properly handled on first load */}
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
