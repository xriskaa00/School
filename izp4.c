#include "types.h"
#include <stdio.h>


/**
 * Check if the value is in the supplied set
 * 
 * @param set Integer array representing a set
 * @param length Length of the provided array
 * @param value Value to be looked up in the set
 * 
 * @return true when the provided `value` is in `set`;
 *    false otherwise
 */
bool is_in_set(int set[], int length, int value) {
  // TODO:
  for (int i = 0; i < length; i++) {
      if (set[i] == value) {
          return true;
      }
  }
  return false;
}

/**
 * Check if the supplied array represents set,
 *   i.e., if every value is unique
 * 
 * @param set Integer array representing a set
 * @param length Length of the provided array
 * 
 * @return true when the provided `set` is an actual set;
 *    false otherwise
 */
bool is_set(int set[], int length) {
  // TODO:
  for (int i = 0; i < length; i++)  {
      for (int j = 0; j < length; j++) {
          if(i == j) {
            continue;
          } else if(set[i] == set[j]) {
            return false;
          }
      }
  }
  return true;
}

      /**
       * Check if the supplied array is a more effective representation of set,
       *   i.e., every value is unique and the values are sorted
       *
       * @param set Integer array representing a set
       * @param length Length of the provided array
       *
       * @return true when the provided set is sorted;
       *    false otherwise
       */
      bool
      is_sorted_set(int set[], int length) {
		for (int i = 1; i < length; i++) {
			if (set[i - 1] >= set[i]) {
				return  false;
			}
		}
		return true;
}

/**
 * Print an intersection of set1 and set2
 * 
 * @param set1 First integer array representing a set
 * @param set1_length Length of the first provided array
 * @param set2 Second integer array representing a set
 * @param set2_length Length of the second provided array
 */
void print_intersection(int set1[], int set2[], int set1_length, int set2_length) {
	printf("{");
  // TODO:
	for(int i = 0; i < set1_length; i++) {
    for (int j = 0; j < set2_length; j++) {
		if(set2[j] > set1[i]) {
			break;
		} else if (set2[j] == set1[i]) {
			printf("%d, ", set1[i]);
			break;
		}
	}
	}
	printf("}\n");
}

/**
 * Print union of set1 and set2
 * 
 * @param set1 First integer array representing a set
 * @param set1_length Length of the first provided array
 * @param set2 Second integer array representing a set
 * @param set2_length Length of the second provided array
 */
void print_union(int set1[], int set2[], int set1_length, int set2_length) {
	printf("{");
  // TODO:
    for(int i = 0; i < set1_length; i++)
    {
    	if(!is_in_set(set2, set2_length, set1[i]))
        {
        printf("%d, ", set1[i]);
        }
    }
	for(int i = 0; i < set2_length; i++)
    {
    	printf("%d, ", set2[i]);
    }
		printf("}\n") ;
}
/**
 * Print cartesian product of set1 and set2
 * 
 * @param set1 First integer array representing a set
 * @param set1_length Length of the first provided array
 * @param set2 Second integer array representing a set
 * @param set2_length Length of the second provided array
 */
void print_product(int set1[], int set2[], int set1_length, int set2_length) {
	printf("{");
  // TODO:
    for(int i = 0; i < set1_length; i++)
    {
        for(int j = 0; j < set2_length; j++)
        {
		printf("(%d, %d), " , set1[i], set2[j]);
        }
    }
	printf("}\n");
}
#ifndef TEST_BUILD

#define SET_LENGTH 5

int main() {
	int set1[SET_LENGTH];
	int set2[SET_LENGTH];

	// Some example inputs (also try to switch set1 and set2!):
	// int set1 = {5, 1, 7, 3, 8}
	// int set2 = {4, 10, 6, 8, 5}
	// ----
	// int set1 = {1, 3, 5, 7, 8}
	// int set2 = {4, 5, 6, 8, 10}
	// ----
	// int set1 = {1, 3, 4, 5, 9}
	// int set2 = {2, 6, 7, 8, 10}

	printf("Please specify a set (%d numbers): ", SET_LENGTH);
	for (int i = 0; i < SET_LENGTH; i++) {
		scanf("%d", &set1[i]);
	}
	// Only test that the array values are unique
	if (!is_set(set1, SET_LENGTH)) {
		printf("Error: the set contains duplicate values!\n");
		return 1;
	}
	if (!is_sorted_set(set1, SET_LENGTH)) {
		printf("Info: the set is not sorted!\n");
	}

	printf("Please specify a set (%d numbers): ", SET_LENGTH);
	for (int i = 0; i < SET_LENGTH; i++) {
		scanf("%d", &set2[i]);
	}
	// Only test that the array values are unique
	if (!is_set(set2, SET_LENGTH)) {
		printf("Error: the set contains duplicate values!\n");
		return 1;
	}
	if (!is_sorted_set(set2, SET_LENGTH)) {
		printf("Info: the set is not sorted!\n");
	}

	// Since the set do not have to be sorted, use inefficient versions
	printf("Intersection: ");
	print_intersection(set1, set2, SET_LENGTH, SET_LENGTH);
	printf("Union:        ");
	print_union(set1, set2, SET_LENGTH, SET_LENGTH);
	printf("Product:      ");
	print_product(set1, set2, SET_LENGTH, SET_LENGTH);
	printf("\n");

	return 0;
}

#endif
