import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = await api.getPage(id)
  id = idToUuid(id)
  const collectionValue = Object.values(response.collection || {})[0]
    ?.value as any
  const collection = collectionValue?.value ?? collectionValue
  let block = response.block || ({} as any)
  const schema = collection?.schema

  const blockEntry = block[id]?.value as any
  const blockValue = blockEntry?.value ?? blockEntry
  const rawMetadata = blockValue

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view"
  ) {
    return []
  } else {
    // Construct Data
    let pageIds = getAllPageIds(response)

    // Fallback for workspaces where `collection_query` is empty.
    if (!pageIds.length && rawMetadata?.collection_id && rawMetadata?.view_ids) {
      const fallbackCollectionData: any = await api.getCollectionData(
        rawMetadata.collection_id,
        rawMetadata.view_ids[0],
        {
          limit: 10000,
          searchQuery: "",
          userTimeZone: "Asia/Seoul",
          loadContentCover: false,
        }
      )

      const fallbackIds =
        fallbackCollectionData?.result?.reducerResults?.collection_group_results
          ?.blockIds ||
        fallbackCollectionData?.result?.collection_group_results?.blockIds ||
        fallbackCollectionData?.result?.blockIds ||
        []

      pageIds = fallbackIds
      block = { ...block, ...fallbackCollectionData?.recordMap?.block }
    }

    if (!pageIds.length) return []

    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties = (await getPageProperties(id, block, schema)) || null
      if (!properties) continue

      // Add fullwidth, createdtime to properties
      const pageBlockEntry = block[id]?.value as any
      const pageBlockValue = pageBlockEntry?.value ?? pageBlockEntry
      properties.createdTime = pageBlockValue?.created_time
        ? new Date(pageBlockValue?.created_time).toString()
        : ""
      properties.fullWidth =
        (pageBlockValue?.format as any)?.page_full_width ?? false

      // Next.js static props serialization fails on `undefined` in nested objects.
      data.push(JSON.parse(JSON.stringify(properties)))
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  }
}
