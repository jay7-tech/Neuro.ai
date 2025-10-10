
import images from './placeholder-images.json';
import type { FamilyMember } from '@/components/shared/family-tree-view';

export const patient = {
    name: 'John Doe',
    id: 'P-12345XYZ',
    photo: images.patient.johnDoe.src,
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

export const initialFamilyMembers: FamilyMember[] = [
    {
        id: 1,
        name: 'Jane Doe',
        relation: 'Wife',
        photo: images.family.janeDoe.src,
        message: '"Through thick and thin, for all these years. I love you more every day."',
        hint: images.family.janeDoe.hint
    },
    { 
        id: 2, 
        name: 'Peter Doe', 
        relation: 'Son', 
        photo: images.family.peterDoe.src, 
        message: '"Dad, you taught me everything I know about being strong and kind."',
        hint: images.family.peterDoe.hint
    },
    { 
        id: 3, 
        name: 'Mary Doe', 
        relation: 'Daughter', 
        photo: images.family.maryDoe.src, 
        message: '"Remember our fishing trips? Those are my favorite memories, Dad."',
        hint: images.family.maryDoe.hint
    },
]


export type PatientLocation = {
    status: 'home' | 'away';
    address: string;
    mapImage: string;
    lastUpdated: string;
}

export const mockPatientLocation: PatientLocation = {
    status: 'home',
    address: '123 Memory Lane, Sunnyvale, CA',
    mapImage: images.location.mapHome.src,
    lastUpdated: '2 minutes ago'
}

    
