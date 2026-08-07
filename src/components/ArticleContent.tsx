import type { ArticleBlock } from "@/lib/articles";

export function ArticleContent({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const level = block.level ?? 2;
          if (level === 3) {
            return (
              <h3
                key={index}
                className="font-display pt-2 text-lg tracking-tight text-ink sm:text-xl"
              >
                {block.text}
              </h3>
            );
          }
          return (
            <h2
              key={index}
              className="font-display pt-4 text-xl tracking-tight text-ink sm:text-[1.35rem]"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "paragraph") {
          return <p key={index}>{block.text}</p>;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={index}
              className={
                block.ordered
                  ? "list-decimal space-y-1.5 pl-5"
                  : "list-disc space-y-1.5 pl-5"
              }
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }

        return null;
      })}
    </div>
  );
}
