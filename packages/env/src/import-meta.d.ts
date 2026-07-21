interface ImportMetaEnv {
  readonly [key: string]: boolean | string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
