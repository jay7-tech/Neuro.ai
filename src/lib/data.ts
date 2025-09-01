
export const patient = {
    name: 'John Doe',
    id: 'P-12345XYZ',
    photo: 'https://picsum.photos/id/237/200/200',
    age: 78,
    bloodGroup: 'O+',
    address: '123 Memory Lane, Suite 101, Sunnyvale, CA 94086',
    medicalInfo: 'Mild cognitive impairment. Allergic to penicillin.',
    caregivers: [
        { name: 'Jane Smith', relation: 'Primary Caregiver', phone: '555-0101' },
        { name: 'Dr. Emily White', relation: 'Neurologist', phone: '555-0102' },
    ],
    family: [
        { name: 'Peter Doe', relation: 'Son', phone: '555-0103' },
        { name: 'Mary Doe', relation: 'Daughter', phone: '555-0104' },
    ],
    medications: [
      { id: 1, name: 'Aricept', dose: '1 tablet', time: '09:00' },
      { id: 2, name: 'Namenda', dose: '1 tablet', time: '20:00' },
    ]
};

export const familyTree = {
    spouse: {
        name: 'Jane Doe',
        relation: 'Wife',
        photo: 'https://picsum.photos/id/1027/200/200',
        quote: '"Through thick and thin, for all these years. I love you more every day."'
    },
    children: [
        { name: 'Peter Doe', relation: 'Son', photo: 'https://picsum.photos/id/64/200/200', quote: '"Dad, you taught me everything I know about being strong and kind."' },
        { name: 'Mary Doe', relation: 'Daughter', photo: 'https://picsum.photos/id/1011/200/200', quote: '"Remember our fishing trips? Those are my favorite memories, Dad."' },
    ]
}
