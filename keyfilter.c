#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINE 100

// Funkce pro kontrolu, zda prefix odpovídá začátku řetězce (case-insensitive)
int prefix_match(const char *prefix, const char *str) {
    for (int i = 0; prefix[i] && str[i]; i++) {
        if (tolower(prefix[i]) != tolower(str[i])) return 0;
    }
    return 1;
}

// Načtení adres ze stdin do dynamického pole
char **load_addresses(int *count) {
    char buffer[MAX_LINE + 1];
    char **addresses = NULL;
    int size = 0;

    while (fgets(buffer, sizeof(buffer), stdin)) {
        // odstraní \n i \r (pro Windows i Linux)
        buffer[strcspn(buffer, "\r\n")] = '\0';
        if (buffer[0] == '\0') continue; // přeskočí prázdné řádky
        addresses = realloc(addresses, (size + 1) * sizeof(char*));
        if (!addresses) {
            fprintf(stderr, "Memory allocation failed\n");
            exit(1);
        }
        addresses[size] = strdup(buffer);
        if (!addresses[size]) {
            fprintf(stderr, "Memory allocation failed\n");
            exit(1);
        }
        size++;
    }

    *count = size;
    return addresses;
}

int main(int argc, char *argv[]) {
    char *prefix = (argc > 1) ? argv[1] : "";

    int count;
    char **addresses = load_addresses(&count);

    int found_exact = 0;
    int matches = 0;
    for (int i = 0; i < count; i++) {
        if (strcasecmp(prefix, addresses[i]) == 0) found_exact = 1;
        if (prefix_match(prefix, addresses[i])) matches++;
    }

    // Výpočet povolených kláves – vždy projít všechny odpovídající adresy
    char allowed[256] = {0};
    int prefix_len = strlen(prefix);

    for (int i = 0; i < count; i++) {
        if (prefix_match(prefix, addresses[i])) {
            char c = addresses[i][prefix_len]; // znak po prefixu
            if (c && isalpha(c)) allowed[(unsigned char)toupper(c)] = 1;
        }
    }

    // Vypiš Found: pokud je přesná shoda nebo pouze jedna odpovídající adresa
    if (matches == 0) {
        fprintf(stderr, "Not found\n");
    } else {
        if (found_exact) {
            fprintf(stderr, "Found: %s\n", prefix);
        } else if (matches == 1) {
            for (int i = 0; i < count; i++) {
                if (prefix_match(prefix, addresses[i])) {
                    fprintf(stderr, "Found: %s\n", addresses[i]);
                    break;
                }
            }
        }

        // Vypiš Enable: pokud existují povolené znaky
        int has_allowed = 0;
        for (char c = 'A'; c <= 'Z'; c++) if (allowed[(unsigned char)c]) has_allowed = 1;

        if (has_allowed) {
            fprintf(stderr, "Enable: ");
            for (char c = 'A'; c <= 'Z'; c++) {
                if (allowed[(unsigned char)c]) fprintf(stderr, "%c", c);
            }
            fprintf(stderr, "\n");
        }
    }

    // Uvolnit paměť
    for (int i = 0; i < count; i++) free(addresses[i]);
    free(addresses);

    return 0;
}
