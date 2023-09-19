const fs = require("fs");
const crypto = require("crypto");
class UsersRepository {
  // takes in the repository filen or throws error
  constructor(filename) {
    if (!filename) {
      throw new Error("creating a repository requires a filename");
    }
    this.filename = filename;
    this.fileContent;
    // use sync functions in constructor. Also we ever need to run these once
    try {
      fs.accessSync(this.filename);
    } catch (err) {
      fs.writeFileSync(this.filename, "[]");
    }
  }
  async getAll() {
    try {
      await fs.promises.access(this.filename);
      return JSON.parse(
        await fs.promises.readFile(this.filename, {
          encoding: "utf8",
        })
      );
    } catch (err) {
      console.log(err);
    }
  }
  randomId() {
    // 4 bytes in hex formatted string
    return crypto.randomBytes(4).toString("hex");
  }
  async getOne(id) {
    const records = await this.getAll();
    return records.find((record) => record.id === id);
  }
  async delete(id) {
    const records = await this.getAll();
    // new array of records not matching the given id
    const filteredRecords = records.filter((record) => record.id !== id);
    await this.writeAll(filteredRecords);
  }
  async create(attributes) {
    // generate a salt

    // combine password + salt
    // hash the combination
    const cryptedPass = "";
    crypto.scrypt(
      attributes.password,
      this.randomId(),
      32,
      (err, derivedKey) => {
        if (err) {
        }
        // what is the char that should separate the pass from the salt?
        // store to database
        cryptedPass = derivedKey;
      }
    );

    attributes.id = this.randomId();
    attributes.crypted = cryptedPass;
    const records = await this.getAll();
    records.push(attributes);
    await this.writeAll(records);
    return attributes;
  }
  async writeAll(records) {
    try {
      // utf8 is default of stringify
      await fs.promises.writeFile(
        this.filename,
        // indentation of 2 and line break for easy read
        JSON.stringify(records, null, 2)
      );
    } catch (err) {
      console.log(err);
    }
  }
  async update(id, attributes) {
    const records = await this.getAll();
    const record = records.find((record) => record.id === id);
    if (!record) {
      throw new Error(`user not found by the given id ${id}`);
    }
    // copy into new return value
    // but practically just overwrite (if the same key exists in target) record with attribute
    // so we don't need the return value as the changes are overwritten to the records
    const updatedRecord = Object.assign(record, attributes);
    await this.writeAll(records);
  }
  async getOneBy(attributes) {
    // tehdään find kunkin attributen perusteella. attributejen luuppaus tarpeen, koska find:ssä viittaus kuhunkin ei taida onnistua
    // ellei findin sisällä voi luupata kaikkia attributeja, true palautetaan lopuksi jos kaikki
    const records = await this.getAll();
    // #1 iterate by let of and inner let in, which exposes the key that is used to reference to the value in the object
    for (let record of records) {
      let valuesMatch = true;
      for (let key in attributes) {
        if (record[key] !== attributes[key]) {
          valuesMatch = false;
        }
      }
      if (valuesMatch) {
        return record;
      }
    }

    // #2 or iterate attributes using the find callback.. a bit more hea
    const foundRecord = records.find((record) => {
      let valuesMatch = true;
      for (let key in attributes) {
        if (record[key] !== attributes[key]) {
          valuesMatch = false;
        }
      }
      if (valuesMatch) {
        console.log(
          `attributes ${attributes} DO match existing record: ${JSON.stringify(
            record
          )}`
        );
        return record;
      }
      console.log(`attributes ${attributes} NO match existing ${record}`);
    });
    return foundRecord;
  }
}
// "newer" node versions allows top level use of async/await statements.
// but implement async helper function for older node versions

// just for temporary testing the repository
const test = async () => {
  const repo = new UsersRepository("users.json");
  await repo.getAll();
  repo.create({
    email: "mailiosoite@domain.fi",
    password: "passu",
  });
  // get one by id
  const user = await repo.getOne("eed54111");
  // delete by id
  const deleted = await repo.delete("27f95259");
  // update by id
  const updated = await repo.update("5b033932", {
    password: "muokattupassu2",
    email: "muokattuemail2",
  });
  // get the updated one by the same id to test update by id and password
  const gotOneBy = await repo.getOneBy({
    password: "muokattupassu2",
    email: "muokattuemail2",
  });
  console.log(JSON.stringify(gotOneBy));
};
//test();

// export an instance of the users repository class passing in the default/valid filename) instead of exporting the class...
// ..importing just the class would require creating an instance with the correct filename where ever the class is imported.
// less prone to user error of creating a class intance with invalid filename
// in the case of tha app needing more than one user repository, a default filename would not be optimal
module.exports = new UsersRepository("users.json");
