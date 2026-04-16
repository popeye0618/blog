import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { queryKey } from "src/constants/queryKey"

const useMermaidEffect = () => {
  const memoMermaidRef = useRef<Map<number, string>>(new Map())

  const { data, isFetched } = useQuery({
    queryKey: queryKey.scheme(),
    enabled: false,
  })

  useEffect(() => {
    if (!isFetched) return
    if (typeof window === "undefined") return

    const mermaidBlocks = Array.from(
      document.querySelectorAll<HTMLElement>(
        "pre.language-mermaid, pre > code.language-mermaid"
      )
    )

    if (mermaidBlocks.length === 0) return

    let isCancelled = false

    const renderMermaid = async () => {
      const { default: mermaid } = await import("mermaid")

      mermaid.initialize({
        startOnLoad: true,
        theme: (data as "dark" | "light") === "dark" ? "dark" : "default",
      })

      const promises = mermaidBlocks.map(async (block, i) => {
        const preElement =
          block.tagName === "PRE"
            ? block
            : block.parentElement instanceof HTMLElement
              ? block.parentElement
              : null
        if (!preElement) return

        const cachedCode = memoMermaidRef.current.get(i)
        const sourceCode = cachedCode ?? preElement.textContent ?? ""
        if (!sourceCode) return

        const renderId = `mermaid-${i}-${Date.now()}`
        const svg = await mermaid.render(renderId, sourceCode).then((res) => res.svg)

        if (isCancelled) return

        if (cachedCode !== undefined) {
          preElement.animate(
            [
              { easing: "ease-in", opacity: 0 },
              { easing: "ease-out", opacity: 1 },
            ],
            { duration: 300, fill: "both" }
          )
        }

        preElement.innerHTML = svg
        memoMermaidRef.current.set(i, preElement.textContent ?? "")
      })

      await Promise.all(promises)
    }

    renderMermaid().catch((error) => {
      console.warn(error)
    })

    return () => {
      isCancelled = true
    }
  }, [data, isFetched])

  return
}

export default useMermaidEffect
