#include "types.h"
#include <stdio.h>


/**
 * Get the largest value in the provided array
 * 
 * @note We assume the array is not empty!
 * 
 * @param array Source integer array
 * @param length Size of the array
 * 
 * @return the largest value in the provided array
 */
int get_max(int array[], int length)
{
    // TODO: 1. Find the largest value in the array
    //   be mindful of possible array values
    //   (eg. they may all be negative or extremely large)
    if (length <= 0) {
        return 0;
    }

    // TODO: 2. Return the value found
    int max = array[0];
    for (int i = 1; i < length; i++) {
        if (array[i] > max) {
            max = array[i];
        }
    }

    return max;
}

/**
 * Get the sum o all values in the provided array
 * 
 * @param array Source integer array
 * @param length Size of the array
 * 
 * @return sum of all values in the array
 */
int get_sum(int array[], int length)
{
    // TODO: 1. Sum up all the values of the array
    int sum = 0;
    for (int i = 0; i < length; i++) {
        sum += array[i];
    }
    // TODO: 2. Return the value
    return sum;
}

/**
 * Check that for all indices (plural of index),
 *   array1 has smaller values than array2
 * 
 * @example
 * arr1: [2, 4, 1, 10, -5]
 * arr2: [8, 9, 2, 99, -1]
 *        ^  ^  ^  ^^  ^^
 * 
 * @example
 * arr1: [2, 4, 9, 10, -5]
 * arr2: [8, 9, 2, 99, -1]
 *        ^  ^  x
 * 
 * @note We assume the arrays are of the same length!
 *
 * @param array1 First integer array
 * @param array2 Second integer array
 * @param array_length Length of both arrays
 * 
 * @return true when all values at all indices of array1 are
 *    smaller than corresponding values from array2;
 *    false otherwise
 */
bool values_are_smaller_than(int array1[], int array2[], int array_length)
{
    // TODO: 1. Iterate over all the array items and compare
    //   values from array1 with corresponding ones in array2
    for (int i = 0; i < array_length; i++) {

        // TODO: 2. Return false when there is value in array1
        //    larger than corresponding one in array2
        if (array1[i] > array2[i]) {
            return false;
        }
    }

    // TODO: 3. Return true when all the items have been checked

    return true;
}

#ifndef TEST_BUILD

int main() {
	int arr1[5];

	printf("Please select five numbers: ");
	for (int index = 0; index < 5; index++) {
		scanf("%d", &arr1[index]);
	}

	// We can either save the maximum value into our new variable and then use it later
	int arr_max = get_max(arr1, 5);
	printf("Maximum array value: %d\n", arr_max);

	// Or we can use the function call directly = function call is an expression!
	printf("Sum of array values: %d\n", get_sum(arr1, 5));

	// Read another five numbers so that we can test the smaller_than function
	int arr2[5];
	printf("Please select another five numbers: ");
	for (int index = 0; index < 5; index++) {
		scanf("%d", &arr2[index]);
	}

	// We do not actually have to use the return value
	// We have seen this before with functions such as printf and scanf
	// - they also have a return value!
	if (values_are_smaller_than(arr1, arr2, 5)) {
		printf("The first array is smaller than the second.\n");

	} else {
		printf("The first array is not smaller than the second.\n");

	}

	return 0;
}

#endif
