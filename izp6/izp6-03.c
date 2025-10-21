#include "types.h"

const int UNIVERSUM[MAXITEMS] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

#ifndef TEST_BUILD

int main(void) {
  Set set = {.items = {1, 2, 3, 4, 5}, .cardinality = 5};

  const int pairCount = 3;
  // TODO: 2. staticky inicializujte pole struktur Pair
  Pair pairs[pairCount] = {
  {1, 2},
   {2, 3},
    { 3, 4 }
};
  // TODO: 3., 4., 5. zavolejte implementované funkce a vypište své výsledky
  if (rel_isFunction(pairs, pairCount, &set)) {
      printf("Relace je funkce.\n");
  } else {
      printf("Relace neni funkce.\n");
  }

  int minValue, maxValue;
  if (rel_minMax(pairs, pairCount, &minValue, &maxValue)) {
      printf("Min: %d, Max: %d\n", minValue, maxValue);
  } else {
      printf("rel_minMax: error\n");
  }

  if (rel_isEquivalence(pairs, pairCount, &set)) {
      printf("Relace je ekvivalence.\n");
  } else {
      printf("Relace neni ekvivalence.\n");
  }

  return 0;
}

#endif

/**
 * @param pairs      Prvky nějaké binární relace (pole dvojic)
 * @param pairCount  Počet položek (dvojic) v relaci
 * @param set        Množina nad kterou je relace definována
 *
 * @returns hodnotu true pokud relace je funkcí, false jinak
 */
bool rel_isFunction(Pair pairs[], int pairCount, Set *set) {
    // TODO: 3. definujte a implementujte funkci rel_isFunction
    if (set->cardinality == 0 || pairCount == 0) {
        return false;
    }

    for (int i = 0; i < set->cardinality; i++) {
        int x = set->items[i];
        int found = 0;
        int value = 0;

        for (int j = 0; j < pairCount; j++) {
            if (pairs[j].first == x) {
                if (found && pairs[j].second != value) {
                    return false;
                }
                found = 1;
                value = pairs[j].second;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

/**
 * @param pairs      Prvky nějaké binární relace (pole dvojic)
 * @param pairCount  Počet položek (dvojic) v relaci
 * @param relMin     Ukazatel na proměnnou minimální hodnoty relace
 * @param relMax     Ukazatel na proměnnou maximální hodnoty relace
 *
 * @returns hodnotu true pokud bylo hledání úspěšné, false jinak
 */
bool rel_minMax(Pair pairs[], int pairCount, int *relMin, int *relMax) {
  // TODO: 4. definujte a implementujte funkci rel_minMax
  if (pairCount <= 0) return false; // prázdne pole

  *relMin = pairs[0].second;
  *relMax = pairs[0].second;

  for (int i = 1; i < pairCount; i++) {
    if (pairs[i].second < *relMin)
      *relMin = pairs[i].second;
    if (pairs[i].second > *relMax)
      *relMax = pairs[i].second;
  }

  return true;
}

/**
 * @param pairs      Prvky nějaké binární relace (pole dvojic)
 * @param pairCount  Počet položek (dvojic) v relaci
 * @param set        Množina nad kterou je relace definována
 *
 * @returns hodnotu true pokud relace je relací ekvivalence, false jinak
 */
bool rel_isEquivalence(Pair pairs[], int pairCount, Set *set) {
    // TODO: 5. definujte a implementujte funkci rel_isEquivalence
    // reflexívna – pre každý prvok z množiny hľadaj (x, x)
    for (int i = 0; i < set->cardinality; i++) {
        int x = set->items[i];
        bool found = false;
        for (int j = 0; j < pairCount; j++) {
            if (pairs[j].first == x && pairs[j].second == x) {
                found = true;
            }
        }
        if (!found) {
            return false;
        }
    }

    for (int i = 0; i < pairCount; i++) {
        bool found = false;
        for (int j = 0; j < pairCount; j++) {
            if (pairs[i].first == pairs[j].second && pairs[i].second == pairs[j].first) {
                found = true;
            }
        }
        if (!found) {
            return false;
        }
    }

    for (int a = 0; a < pairCount; a++) {
        for (int b = 0; b < pairCount; b++) {
            if (pairs[a].second == pairs[b].first) {
                bool found = false;
                for (int c = 0; c < pairCount; c++) {
                    if (pairs[c].first == pairs[a].first && pairs[c].second == pairs[b].second) {
                        found = true;
                    }
                }
                if (!found) {
                    return false;
                }
            }
        }
    }
    return true;
}