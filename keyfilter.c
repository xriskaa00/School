#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINES 1000
#define MAX_LEN 100

// Skontroluje, či text začína daným prefixom (ignoruje veľkosť písmen)
int startsWith(const char *prefix, const char *text) {
    int plen = strlen(prefix);
    int tlen = strlen(text);
    if (tlen < plen) return 0;
    for (int i = 0; i < plen; i++)
        if (tolower(prefix[i]) != tolower(text[i])) return 0;
    return 1;
}

// Porovná dva reťazce ignorujúc veľkosť písmen
int equalsIgnoreCase(const char *a, const char *b) {
    int i = 0;
    while (a[i] && b[i]) {
        if (tolower(a[i]) != tolower(b[i])) return 0;
        i++;
    }
    return a[i] == b[i];
}

int main(int argc, char *argv[]) {
    char *prefix = (argc > 1) ? argv[1] : "";

    char cities[MAX_LINES][MAX_LEN + 1];
    int totalCities = 0;

    // Načíta dáta zo stdin
    while (totalCities < MAX_LINES && fgets(cities[totalCities], MAX_LEN + 1, stdin)) {
        cities[totalCities][strcspn(cities[totalCities], "\r\n")] = 0;
        if (cities[totalCities][0] != 0) totalCities++;
    }

    int matchingIndexes[MAX_LINES];
    int matchCount = 0;
    int exactMatchIndex = -1;

    // Nájde zhody a presnú zhodu
    for (int i = 0; i < totalCities; i++) {
        if (startsWith(prefix, cities[i])) {
            matchingIndexes[matchCount++] = i;
            if (equalsIgnoreCase(prefix, cities[i])) exactMatchIndex = i;
        }
    }

    if (matchCount == 0) {
        printf("Not found\n");
        return 0;
    }

    // Ak zostala len jedna možnosť, vypíšeme ju a končíme
    if (matchCount == 1) {
        printf("Found: %s\n", cities[matchingIndexes[0]]);
        return 0;
    }

    // Ak existuje presná zhoda, vypíšeme ju
    if (exactMatchIndex != -1) {
        printf("Found: %s\n", cities[exactMatchIndex]);
    }

    // Vypočítame Enable písmená
    char enableLetters[256] = {0};
    int anyEnable = 0;
    int prefixLen = strlen(prefix);

    for (int i = 0; i < matchCount; i++) {
        int idx = matchingIndexes[i];
        if (idx == exactMatchIndex) continue; // presnú zhodu ignorujeme
        char nextChar = cities[idx][prefixLen];
        if (isalpha(nextChar)) {
            enableLetters[(unsigned char)tolower(nextChar)] = 1;
            anyEnable = 1;
        }
    }

    // Vypíš Enable iba ak existuje nejaké ďalšie písmeno
    if (anyEnable) {
        printf("Enable: ");
        for (char c = 'a'; c <= 'z'; c++) {
            if (enableLetters[(unsigned char)c]) printf("%c", c);
        }
        printf("\n");
    }

    return 0;
}
