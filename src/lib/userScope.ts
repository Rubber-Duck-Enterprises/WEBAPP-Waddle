let _getScope = () => "anon";

export function setScopeGetter(fn: () => string) {
  _getScope = fn;
}

export function getScope() {
  return _getScope();
}