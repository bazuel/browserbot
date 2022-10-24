export function jsonToQueryString(json, excludeQuestionMark = false) {
  return (
    (excludeQuestionMark ? '' : '?') +
    Object.keys(json)
      .map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
      })
      .join('&')
  );
}
