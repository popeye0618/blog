import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/router"
import { queryKey } from "src/constants/queryKey"
import { PostDetail } from "src/types"

const usePostQuery = () => {
  const router = useRouter()
  const { slug } = router.query
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug
  const { data } = useQuery<PostDetail>({
    queryKey: queryKey.post(normalizedSlug ?? ""),
    enabled: false,
  })

  return data
}

export default usePostQuery
