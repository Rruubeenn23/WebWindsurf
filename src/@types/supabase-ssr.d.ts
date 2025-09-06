declare module '@supabase/ssr' {
  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string
  ): any;
}
