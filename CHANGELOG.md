# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 5.2.0 - 2020-11-12

### Added

- IOContext export.
- pruneCache function to clean orphaned cache entries.

### Fixed

- Really fix useIO initial error handling. Adds request cache outside of react state.

## 5.1.2 - 2020-11-07

### Fixed

- Fix useIO handling of initial async error.

## 5.1.1 - 2020-08-05

### Fixed

- Restored withIO componentShouldUpdate to avoid rendering while waiting.

## 5.1.0 - 2020-08-03

### Added

- Experimental useIO hook with suspense support

### Changed

- Bumped all deps
- Removed recompose dep
- Rename UNSAFE deprecated methods
- Merge WithObservables into WithIO

## 5.0.0 - 2018-09-05

### Changed

- Upgraded to RxJS 6.
- Moved react, recompose & rxjs from peerDependencies to dependencies.
- Import named recompose exports from root.

## 4.5.0 - 2018-05-12

### Added

- isStatic flag to avoid resubscription on update.

## 4.4.9 - 2018-05-08

### Fixed

- Unhandled errors are thrown to React instead of logged.
