#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINES 1000
#define MAX_LEN 100

// Funkcia zistí, či daný reťazec začína prefixom (ignoruje veľké/malé písmená)
int startsWith(const char *prefix, const char *text) {
    int i = 0;
    while (prefix[i] && text[i]) {
        if (tolower(prefix[i]) != tolower(text[i])) {
            return 0;
        }
        i++;
    }
    return 1;
}

// Načíta všetky riadky zo vstupu do poľa (max 1000 riadkov)
int loadData(char lines[][MAX_LEN + 1]) {
    int count = 0;
    while (count < MAX_LINES && fgets(lines[count], MAX_LEN + 1, stdin)) {
        // odstránim znak nového riadku
        lines[count][strcspn(lines[count], "\r\n")] = '\0';
        if (lines[count][0] != '\0') {
            count++;
        }
    }
    return count;
}

int main(int argc, char *argv[]) {
    char *prefix = (argc > 1) ? argv[1] : "";

    char items[MAX_LINES][MAX_LEN + 1];
    int total = loadData(items);

    int foundExact = 0;
    int foundCount = 0;

    // kontrola zhôd
    for (int i = 0; i < total; i++) {
        if (strcmp(prefix, items[i]) == 0) foundExact = 1;
        if (startsWith(prefix, items[i])) foundCount++;
    }

    if (foundCount == 0) {
        fprintf(stderr, "Not found\n");
    } else if (foundExact || foundCount == 1) {
        // ak je len jedno možné mesto alebo presná zhoda
        for (int i = 0; i < total; i++) {
            if (startsWith(prefix, items[i])) {
                fprintf(stderr, "Found: %s\n", items[i]);
                break;
            }
        }
    } else {
        // ak je viac možností, vypíše sa povolené písmená
        char allowed[256] = {0};
        int len = strlen(prefix);

        for (int i = 0; i < total; i++) {
            if (startsWith(prefix, items[i])) {
                char next = items[i][len];
                if (isalpha(next)) allowed[toupper(next)] = 1;
            }
        }

        fprintf(stderr, "Enable: ");
        for (char c = 'A'; c <= 'Z'; c++) {
            if (allowed[(unsigned char)c]) fprintf(stderr, "%c", c);
        }
        fprintf(stderr, "\n");
    }

    return 0;
}
