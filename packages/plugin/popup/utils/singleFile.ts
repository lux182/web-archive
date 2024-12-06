import { type SingleFileSetting, mergeDefaultSingleFileSetting } from '~/utils/singleFile'

export function getSingleFileSetting() {
  const setting = localStorage.getItem('single-file-setting')
  return mergeDefaultSingleFileSetting(setting ? JSON.parse(setting) : undefined)
}

export function setSingleFileSetting(setting: SingleFileSetting) {
  localStorage.setItem('single-file-setting', JSON.stringify(setting))
}
