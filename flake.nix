{
  description = "Newman with directory-based collection support";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages.default = pkgs.buildNpmPackage {
          pname = "newman-dir";
          version = "6.0.0-dir";
          src = self;
          npmDepsHash = "sha256-Aeeqfohxl0P+MnVPxzYHQZzetYiAohxaoui45+HxYwY=";
          dontNpmBuild = true;
          meta = {
            description = "Newman with directory-based collection support";
            license = pkgs.lib.licenses.asl20;
            mainProgram = "newman";
          };
        };
      }
    );
}
