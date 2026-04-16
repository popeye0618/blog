import { idToUuid } from "notion-utils"
import { ExtendedRecordMap, ID } from "notion-types"

export default function getAllPageIds(
  response: ExtendedRecordMap,
  viewId?: string
) {
  const collectionQuery = response.collection_query
  if (!collectionQuery) return []

  const views = Object.values(collectionQuery)[0] as any
  if (!views || typeof views !== "object") return []

  let pageIds: ID[] = []
  if (viewId) {
    const vId = idToUuid(viewId)
    pageIds =
      views[vId]?.blockIds ||
      views[vId]?.collection_group_results?.blockIds ||
      []
  } else {
    const pageSet = new Set<ID>()
    // notion response shapes are inconsistent across versions and workspaces.
    Object.values(views).forEach((view: any) => {
      const ids =
        view?.collection_group_results?.blockIds ||
        view?.blockIds ||
        view?.reducerResults?.collection_group_results?.blockIds ||
        []
      ids.forEach((id: ID) => pageSet.add(id))
    })
    pageIds = [...pageSet]
  }
  return pageIds
}
