#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINES 1000
#define MAX_LEN 100

// kuknem či text začína na prefix (neriešim veľké/malé písmená)
int startsWith(const char *prefix, const char *text) {
    int prefixLength = strlen(prefix);
    int textLength = strlen(text);
    if (textLength < prefixLength)  {
        return 0;
    }
    for (int charIndex = 0; charIndex < prefixLength; charIndex++) {
        if (tolower(prefix[charIndex]) != tolower(text[charIndex])) {
            return 0;
        }
    }
    return 1;
}

// porovnáva dva texty bez ohľadu na veľké/malé písmená
int equalsIgnoreCase(const char *firstText, const char *secondText) {
    int charIndex = 0;
    while (firstText[charIndex] && secondText[charIndex]) {
        if (tolower(firstText[charIndex]) != tolower(secondText[charIndex])) {
            return 0;
        }
        charIndex++;
    }
    return firstText[charIndex] == secondText[charIndex];
}

int main(int argc, char *argv[]) {
    // prefix z argumentu, ak nie je zadaný, nech je prázdny
    char *prefix = (argc > 1) ? argv[1] : "";

    char cities[MAX_LINES][MAX_LEN + 1];
    int totalCities = 0;

    // načítam mestá zo vstupu
    while (totalCities < MAX_LINES && fgets(cities[totalCities], MAX_LEN + 1, stdin)) {
        // odstránim ENTER na konci, lebo fgets ho pridal
        cities[totalCities][strcspn(cities[totalCities], "\r\n")] = 0;
        if (cities[totalCities][0] != 0)
            totalCities++;
    }

    int matchingIndexes[MAX_LINES];
    int numberOfMatches = 0;
    int exactMatchIndex = -1;

    // prejdeme všetky mestá a hľadáme tie čo začínajú na prefix
    for (int cityIndex = 0; cityIndex < totalCities; cityIndex++) {
        if (startsWith(prefix, cities[cityIndex])) {
            matchingIndexes[numberOfMatches++] = cityIndex;
            if (equalsIgnoreCase(prefix, cities[cityIndex])) {
                exactMatchIndex = cityIndex;
            }
        }
    }

    // nič sa nenašlo
    if (numberOfMatches == 0) {
        printf("Not found\n");
        return 0;
    }

    // našlo sa len jedno mesto
    if (numberOfMatches == 1) {
        printf("Found: %s\n", cities[matchingIndexes[0]]);
        return 0;
    }

    // ak existuje presná zhoda
    if (exactMatchIndex != -1) {
        printf("Found: %s\n", cities[exactMatchIndex]);
    }

    char possibleLetters[256] = {0};
    int hasNextLetter = 0;
    int prefixLength = strlen(prefix);

    // pozriem, aké ďalšie písmená sa môžu dopísať (Enable)
    for (int matchIndex = 0; matchIndex < numberOfMatches; matchIndex++) {
        int currentCityIndex = matchingIndexes[matchIndex];
        if (currentCityIndex == exactMatchIndex) {
             continue;
        }

        char nextChar = cities[currentCityIndex][prefixLength];
        if (isalpha(nextChar)) {
            possibleLetters[(unsigned char)tolower(nextChar)] = 1;
            hasNextLetter = 1;
        }
    }

    // ak existujú nejaké možné ďalšie písmená, vypíšem ich
    if (hasNextLetter) {
        printf("Enable: ");
        for (char letter = 'a'; letter <= 'z'; letter++) {
            if (possibleLetters[(unsigned char)letter]) {
                printf("%c", letter);
            }
        }
        printf("\n");
    }

    return 0;
}
