import Browser from 'webextension-polyfill'
import '~/lib/browser-polyfill.min.js'
import '~/lib/single-file-background.js'
import { onMessage, sendMessage } from 'webext-bridge/background'
import { isNotNil } from '@web-archive/shared/utils'
import { createAndRunTask, getTaskList } from './processor'
import { base64ToBlob } from '~/utils/file.js'

async function appendAuthHeader(options?: RequestInit) {
  const { token } = await Browser.storage.local.get('token') ?? {}
  if (!options) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  options.headers = Object.assign(options?.headers ?? {}, {
    Authorization: `Bearer ${token}`,
  })
  return options
}

/* global RequestInit */
export async function request(url: string, options?: RequestInit | undefined) {
  const { serverUrl } = await Browser.storage.local.get('serverUrl')
  const res = await fetch(`${serverUrl}/api${url}`, {
    credentials: 'same-origin',
    ...await appendAuthHeader(options),
  })
  if (res.ok) {
    const json = await res.json()
    if (json.code === 200) {
      return json.data
    }

    throw new Error(json.message)
  }
  throw new Error('Failed to fetch')
}

onMessage('set-server-url', async ({ data: { url } }) => {
  const serverUrl = url.endsWith('/') ? url.slice(0, -1) : url
  await Browser.storage.local.set({ serverUrl })
  return {
    success: true,
  }
})
onMessage('get-server-url', async () => {
  const { serverUrl } = await Browser.storage.local.get('serverUrl')
  return { serverUrl }
})

onMessage('check-auth', async () => {
  try {
    await request('/auth', {
      method: 'POST',
    })
    return {
      success: true,
    }
  }
  catch {
    return {
      success: false,
    }
  }
})

onMessage('get-token', async () => {
  const { token } = await Browser.storage.local.get('token')
  return { token }
})

onMessage('set-token', async ({ data: { token } }) => {
  await Browser.storage.local.set({ token })
  return { success: true }
})

onMessage('get-all-folders', async () => {
  const folders = await request('/folders/all', {
    method: 'GET',
  })
  return {
    folders,
  }
})

onMessage('add-save-page-task', async ({ data: { tabId, singleFileSetting, pageForm } }) => {
  createAndRunTask({
    tabId,
    singleFileSetting,
    pageForm,
  })
})

onMessage('get-page-task-list', async () => {
  return {
    taskList: await getTaskList(),
  }
})
