{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    buildInputs = [
      pkgs.nodejs_20
      pkgs.zip
      pkgs.unzip
    ];
  }
