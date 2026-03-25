(function () {
  "use strict";

  const LABELS_CONTINUE = [
    "weiterschauen",
    "continue watching",
    "fortsetzen",
    "reprendre",
    "continuar viendo",
    "continua a guardare"
  ];

  const LABELS_UPNEXT = [
    "als nächstes",
    "up next",
    "next up",
    "prochain",
    "siguiente",
    "successivo"
  ];

  const PROCESSED_FLAG = "data-merge-rows-processed";

  function normalize(text) {
    return (text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function includesAny(text, keywords) {
    const value = normalize(text);
    return keywords.some((keyword) => value.includes(keyword));
  }

  function getSectionTitle(section) {
    const titleEl = section.querySelector("h1, h2, h3, .sectionTitle, .sectionTitleContainer, .homeSectionHeader");
    return titleEl ? normalize(titleEl.textContent) : "";
  }

  function findRowInSection(section) {
    return (
      section.querySelector(".itemsContainer") ||
      section.querySelector(".emby-scrollbuttons") ||
      section.querySelector(".cardScalable")?.closest(".itemsContainer") ||
      section.querySelector("[class*='itemsContainer']")
    );
  }

  function getRowChildCardNode(node, row) {
    let current = node;
    while (current && current.parentElement !== row) {
      current = current.parentElement;
    }
    return current && current.parentElement === row ? current : null;
  }

  function getCards(row) {
    const selector = ".cardBox, .cardScalable, .card";

    const directCards = Array.from(row.children).filter((child) => {
      return child.matches(selector) || !!child.querySelector(selector);
    });

    if (directCards.length) {
      return directCards;
    }

    const fallback = Array.from(row.querySelectorAll(selector))
      .map((node) => getRowChildCardNode(node, row))
      .filter(Boolean);

    return Array.from(new Set(fallback));
  }

  function getCardKey(card) {
    return card.getAttribute("data-id") || card.querySelector("a")?.getAttribute("href") || "";
  }

  function getScrollHost(row) {
    if (!row) {
      return null;
    }

    return row.closest(".emby-scrollslider, .emby-scroller") || row.parentElement;
  }

  function enableNativeHorizontalScroll(row) {
    const scrollHost = getScrollHost(row);
    if (!scrollHost) {
      return;
    }

    row.style.display = "flex";
    row.style.flexWrap = "nowrap";

    getCards(row).forEach((card) => {
      card.style.flex = "0 0 auto";
    });

    scrollHost.style.overflowX = "auto";
    scrollHost.style.overflowY = "hidden";
    scrollHost.style.scrollBehavior = "smooth";

    if (!scrollHost.dataset.mergeRowsWheelBound) {
      scrollHost.addEventListener(
        "wheel",
        (event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
            return;
          }

          event.preventDefault();
          scrollHost.scrollLeft += event.deltaY;
        },
        { passive: false }
      );
      scrollHost.dataset.mergeRowsWheelBound = "1";
    }
  }

  function recalculateRowScroll(row) {
    if (!row) {
      return;
    }

    requestAnimationFrame(() => {
      enableNativeHorizontalScroll(row);

      const cards = getCards(row);
      if (!cards.length) {
        return;
      }

      // In some Jellyfin builds the row width is frozen after initial render.
      // After moving cards we force a content-based width so right-side items are reachable.
      row.style.width = "max-content";
      row.style.minWidth = "max-content";

      if (row.scrollWidth <= row.clientWidth + 1) {
        const style = window.getComputedStyle(row);
        const gap = parseFloat(style.columnGap || style.gap || "0") || 0;
        const totalWidth = cards.reduce((sum, card) => sum + card.getBoundingClientRect().width, 0) + gap * Math.max(cards.length - 1, 0);

        if (totalWidth > 0) {
          const px = Math.ceil(totalWidth) + "px";
          row.style.width = px;
          row.style.minWidth = px;
        }
      }

      const scrollHost = getScrollHost(row);
      if (scrollHost) {
        scrollHost.scrollLeft = 0;
      }

      window.dispatchEvent(new Event("resize"));
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    });
  }

  function markProcessed(section) {
    section.setAttribute(PROCESSED_FLAG, "1");
  }

  function isProcessed(section) {
    return section.getAttribute(PROCESSED_FLAG) === "1";
  }

  function findCandidateSections() {
    const sections = Array.from(document.querySelectorAll("section, .homeSection, .verticalSection"));

    let continueSection = null;
    let upNextSection = null;

    for (const section of sections) {
      const title = getSectionTitle(section);
      if (!title) {
        continue;
      }

      if (!continueSection && includesAny(title, LABELS_CONTINUE)) {
        continueSection = section;
      }

      if (!upNextSection && includesAny(title, LABELS_UPNEXT)) {
        upNextSection = section;
      }

      if (continueSection && upNextSection) {
        break;
      }
    }

    return { continueSection, upNextSection };
  }

  function mergeRows() {
    const { continueSection, upNextSection } = findCandidateSections();

    if (!continueSection || !upNextSection || isProcessed(upNextSection)) {
      return;
    }

    const continueRow = findRowInSection(continueSection);
    const upNextRow = findRowInSection(upNextSection);

    if (!continueRow || !upNextRow) {
      return;
    }

    const existingIds = new Set(
      getCards(continueRow)
        .map((card) => getCardKey(card))
        .filter(Boolean)
    );

    const upNextCards = getCards(upNextRow);
    if (!upNextCards.length) {
      return;
    }

    for (const card of upNextCards) {
      const key = getCardKey(card);

      if (key && existingIds.has(key)) {
        continue;
      }

      continueRow.appendChild(card);

      if (key) {
        existingIds.add(key);
      }
    }

    upNextSection.style.display = "none";
    markProcessed(upNextSection);
    recalculateRowScroll(continueRow);
  }

  const observer = new MutationObserver(() => {
    mergeRows();
  });

  function init() {
    mergeRows();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    window.addEventListener("beforeunload", () => observer.disconnect(), { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
