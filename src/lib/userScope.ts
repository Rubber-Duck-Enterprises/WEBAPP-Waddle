let _getScope = () => "anon";

export function setScopeGetter(fn: () => string) {
  _getScope = fn;
}

export function getScope() {
  const scope = _getScope();
  console.log("📍 getScope() llamado:", scope);
  return scope;
}