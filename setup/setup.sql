CREATE TABLE TASKS (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	text varchar(64) NOT NULL,
	disabled BOOL DEFAULT(false)
);

CREATE TABLE AVAILABILITIES (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	text varchar(32) NOT NULL,
	disabled BOOL DEFAULT(false)
);

CREATE TABLE USERS (
	name varchar(64) PRIMARY KEY,
	password binary(60) NOT NULL,
	admin BOOL NOT NULL DEFAULT(false),
	tokenID varchar(64) NOT NULL,
	CHECK (CHAR_LENGTH(password) = 60),
	CHECK (CHAR_LENGTH(tokenID) = 36)
);

CREATE TABLE EVENTS (
	id INTEGER PRIMARY KEY AUTO_INCREMENT,
	date DATETIME NOT NULL,
	description TEXT DEFAULT("")
);

CREATE TABLE USER_AVAILABILITIES (
	userName varchar(64) NOT NULL,
	eventID INTEGER NOT NULL,
	availabilityID INTEGER NOT NULL,
	PRIMARY KEY (userName, eventID),
	FOREIGN KEY (userName) REFERENCES USERS(name) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (eventID) REFERENCES EVENTS(id) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (availabilityID) REFERENCES AVAILABILITIES(id) ON UPDATE CASCADE
);

CREATE TABLE USER_ASSIGNMENTS (
	eventID INTEGER NOT NULL,
	taskID INTEGER NOT NULL,
	userName varchar(64),
	PRIMARY KEY (eventID, taskID),
	FOREIGN KEY (eventID) REFERENCES EVENTS(id) ON DELETE CASCADE,
	FOREIGN KEY (userName) REFERENCES USERS(name) ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (taskID) REFERENCES TASKS(id) ON UPDATE CASCADE
);