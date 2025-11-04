#include "types.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef TEST_BUILD

int main(int argc, char *argv[])
{
    // konfigurace programu
    Config config = {.xFlag = false, .yFlag = false, .sValue = NULL, .nValue = 10};

    if (!parse_args(argv, argc, &config)) {
        fprintf(stderr, "%s\n", usage);
        return 1;
    }

    return 0;
}

#endif

bool parse_args(char **arguments, int argumentCount, Config *config)
{
    for (int i = 1; i < argumentCount; i++) {
        if (strcmp(arguments[i], "-x") == 0) {
            if (config->xFlag || config->yFlag) {
                return false; // duplicita alebo -y už použité
            }
            config->xFlag = true;
        } else if (strcmp(arguments[i], "-y") == 0) {
            if (config->yFlag || config->xFlag) {
                return false; // duplicita alebo -x už použité
            }
            config->yFlag = true;
        } else if (strcmp(arguments[i], "-s") == 0) {
            if (config->sValue != NULL) {
                return false; // duplicita
            }
            if (i + 1 >= argumentCount) {
                return false; // chýba hodnota
            }
            config->sValue = arguments[++i];
        } else if (strcmp(arguments[i], "-n") == 0) {
            if (config->nValue != 10) {
                return false; // duplicita
            }
            if (i + 1 >= argumentCount) {
                return false; // chýba hodnota
            }
            config->nValue = atoi(arguments[++i]);
        } else {
            // neznámy argument
            return false;
        }
    }

    // ❗ -s musí byť vždy uvedené
    if (config->sValue == NULL) {
        return false;
    }

    return true;
}
