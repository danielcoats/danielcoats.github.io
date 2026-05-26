---
layout: post
title: "Style Sample"
---

This is a sample post for checking the visual treatment of common writing elements. It should be useful when adjusting typography, spacing, link styles, and code formatting.

The page uses the same default post layout as real writing, so changes here should reflect what a normal technical article will look like.

## Section Heading

A section heading should create a clear break without making the page feel heavy. Paragraphs underneath should stay readable at the current measure and line height.

Here is a sentence with an [example link](https://example.com), some `inline code`, and enough text to wrap naturally onto another line on narrower screens.

### Subsection Heading

Shorter subsections should feel related to the parent section. They should not compete with the main title or become too dense when several appear close together.

- First list item with a concise point.
- Second list item with a little more text to check wrapping and line height across multiple lines.
- Third list item with `inline code` inside the list.

Numbered lists should keep the same rhythm:

1. Start with the problem.
2. Describe the tradeoff.
3. Make the smallest useful change.

## Blockquote

Blockquotes should be distinct from body text while still fitting the quiet technical style of the site.

> Good systems writing is specific about constraints, honest about tradeoffs, and clear about what changed.

The paragraph after a quote should return cleanly to the normal rhythm.

## Code

Code blocks should be readable, horizontally scrollable when needed, and visually distinct without becoming the loudest element on the page.

```csharp
public sealed class QuoteCache
{
    private readonly Dictionary<string, decimal> prices = new();

    public void Update(string symbol, decimal price)
    {
        prices[symbol] = price;
    }

    public bool TryGetPrice(string symbol, out decimal price)
    {
        return prices.TryGetValue(symbol, out price);
    }
}
```

And a TypeScript example:

```typescript
type MarketStatus = "open" | "closed" | "halted";

function formatStatus(status: MarketStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
```

## Mixed Content

Longer technical posts often combine prose, lists, and code. This section checks those transitions.

Key things to watch:

- Headings should have enough top margin.
- Lists should not feel detached from surrounding paragraphs.
- Code should align with the content column.
- Links should be visible but not distracting.

The final paragraph should leave enough room before the footer so the page does not feel abruptly finished.
