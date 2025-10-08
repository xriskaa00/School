#include "types.h"
#include <stdio.h>


/**
 * Determine whether the provided character is alphabetic.
 * 
 * @param c character
 * 
 * @return true when the provided character `c` is alphabetic;
 *    false otherwise
 */
bool is_alpha(char c)
{
    // TODO: 1. Check whether the value in c represents an alphabetic ASCII character
    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) {
        return true;
    } else {
        return false;
    }
}

/**
 * Determine whether all characters of the provided `string`
 *    (character array) are alphabetic.
 * 
 * @param string input string
 * 
 * @return true when all characters in the provided string are alphabetic;
 * 	  false otherwise
 */
bool is_name(char string[])
{
    // TODO: 1. For each character in string
    //   - determine whether it is alphabetic by calling is_aplha function
    for (int i = 0; string[i] != '\0'; i++) {
        if (!is_alpha(string[i])) {
            return false;
        }
    }
    return true;
}

#ifndef TEST_BUILD

int main() {
	// Limit the size of names to 20 characters + terminating '\0'
	char name[21];
	char surname[21];

	// Let the user specify their name
	printf("Please provide your name: ");
	scanf("%20s", name);

	// Call our new function that checks if the name contains only alphabetic symbols
	// The argument supplied to the function can have a different name than the one
	// specified in the function definition.
	if(!is_name(name)) {
		printf("Provided name contains non-alphabetic characters!\n");
		return 1;
	}

	printf("Please provide your surname: ");
	scanf("%20s", surname);
	if(!is_name(surname)) {
		printf("Provided surname contains non-alphabetic characters!\n");
		return 1;
	}

	printf("Your full name is: %s %s\n", name, surname);
	return 0;
}

#endif
