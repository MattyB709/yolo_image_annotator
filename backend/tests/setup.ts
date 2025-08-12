import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DB_PATH = join(__dirname, '../database/test_annotations.db');

beforeEach(() => {
  // Clean up test database before each test
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Database might be in use, ignore
    }
  }
});

afterAll(() => {
  // Clean up test database after all tests
  if (existsSync(TEST_DB_PATH)) {
    try {
      unlinkSync(TEST_DB_PATH);
    } catch (error) {
      // Database might be in use, ignore
    }
  }
});