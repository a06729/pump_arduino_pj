interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}